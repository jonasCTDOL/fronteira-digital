console.log('Versão 2.0 do app.js carregada'); // Teste de cache

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const initialCoordinates = [-30.87, -55.53];
  const initialZoom = 11;

  const map = L.map('map').setView(initialCoordinates, initialZoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  const drawControl = new L.Control.Draw({
    edit: {
      featureGroup: drawnItems
    },
    draw: {
      polygon: true,
      polyline: true,
      rectangle: true,
      circle: true,
      marker: true
    }
  });
  map.addControl(drawControl);

  // --- LÓGICA DE API ---

  const deleteFeature = async (featureId) => {
    console.log(`--- Iniciando deleteFeature para o ID: ${featureId} ---`);
    try {
      const response = await fetch(`/api/data/${featureId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Status 204 (No Content) também é um sucesso, mas !response.ok será falso.
        // A verificação explícita de 204 é mais robusta.
        if (response.status === 204) {
          console.log(`Desenho ${featureId} excluído com sucesso do backend.`);
          return true;
        }
        const errorText = await response.text();
        throw new Error(errorText || 'Falha ao excluir o desenho.');
      }
      
      console.log(`Desenho ${featureId} excluído com sucesso do backend.`);
      return true;

    } catch (error) {
      console.error('Ocorreu um erro em deleteFeature:', error);
      alert(`Erro ao excluir: ${error.message}`);
      return false;
    }
  };

  const updateFeatureProperties = async (featureId, properties) => {
    try {
      const response = await fetch(`/api/data/${featureId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ properties })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar propriedades.');
      }
      console.log(`Propriedades do desenho ${featureId} atualizadas.`);
      alert('Propriedades salvas com sucesso!');
      map.closePopup(); // Fecha o popup após salvar

    } catch (error) {
      console.error('Erro ao atualizar propriedades:', error);
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  const bindPopupToLayer = (layer) => {
    const feature = layer.feature;
    const featureId = feature.id;
    let properties = feature.properties || {};

    const getPopupContent = () => {
      const title = properties.title || '(Sem título)';
      const description = properties.description || '(Sem descrição)';
      return `
        <div>
          <h4>${title}</h4>
          <p>${description}</p>
          <button class="edit-properties-btn">Editar</button>
        </div>
      `;
    };

    const getEditFormContent = () => {
      const title = properties.title || '';
      const description = properties.description || '';
      return `
        <div>
          <input type="text" id="popup-title" placeholder="Título" value="${title}" style="width: 100%; margin-bottom: 5px;">
          <textarea id="popup-desc" placeholder="Descrição" style="width: 100%; margin-bottom: 5px;">${description}</textarea>
          <button class="save-properties-btn">Salvar</button>
        </div>
      `;
    };

    layer.bindPopup(getPopupContent());

    layer.on('popupopen', () => {
      const popupNode = layer.getPopup().getElement();
      
      const editBtn = popupNode.querySelector('.edit-properties-btn');
      if (editBtn) {
        editBtn.onclick = () => {
          layer.setPopupContent(getEditFormContent());
          
          const saveBtn = layer.getPopup().getElement().querySelector('.save-properties-btn');
          saveBtn.onclick = () => {
            const newTitle = document.getElementById('popup-title').value;
            const newDescription = document.getElementById('popup-desc').value;
            const newProperties = { ...properties, title: newTitle, description: newDescription };
            
            updateFeatureProperties(featureId, newProperties);
            
            properties = newProperties;
            feature.properties = newProperties;
          };
        };
      }
    });
  };

  const loadFeatures = async () => {
    try {
      const response = await fetch('/api/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao carregar seus desenhos.');
      
      const geojsonData = await response.json();
      L.geoJSON(geojsonData, {
        onEachFeature: (feature, layer) => {
          layer.feature = feature;
          drawnItems.addLayer(layer);
          bindPopupToLayer(layer);
        }
      });
    } catch (error) {
      console.error('Erro ao carregar desenhos:', error);
    }
  };

  const saveFeature = async (featureGeoJSON) => {
    console.log('--- Iniciando saveFeature ---');
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(featureGeoJSON)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Falha ao salvar o desenho.');
      }
      
      return await response.json();

    } catch (error) {
      console.error('Ocorreu um erro em saveFeature:', error);
      alert(`Erro ao salvar: ${error.message}`);
      return null;
    }
  };

  map.on(L.Draw.Event.CREATED, async (event) => {
    const layer = event.layer;
    const geoJSON = layer.toGeoJSON();
    geoJSON.properties = { title: 'Novo Desenho', description: '' };

    const savedData = await saveFeature(geoJSON);

    if (savedData && savedData.id) {
      console.log('Desenho salvo com sucesso! ID:', savedData.id);
      layer.feature = { ...geoJSON, id: savedData.id };
      drawnItems.addLayer(layer);
      bindPopupToLayer(layer);
      layer.openPopup();
    } else {
      console.error('Falha ao salvar o desenho. Não foi recebido um ID válido do backend.');
    }
  });

  // --- LÓGICA DE EXCLUSÃO ---
  map.on(L.Draw.Event.DELETED, (event) => {
    console.log('Evento DELETED disparado');
    event.layers.eachLayer(layer => {
      if (layer.feature && layer.feature.id) {
        deleteFeature(layer.feature.id);
      } else {
        console.error('Tentativa de excluir uma camada sem ID de feature.', layer);
      }
    });
  });

  // --- LÓGICA DE EXPORTAÇÃO ---
  document.getElementById('export-button').addEventListener('click', () => {
    const data = drawnItems.toGeoJSON();
    if (data.features.length === 0) {
      alert('Não há nada para exportar!');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "meu_mapa.geojson");
    document.body.appendChild(downloadAnchorNode); // Necessário para o Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });

  loadFeatures();
});
