# Fronteira Digital - Meu Mapa

![Texto Alternativo](https://github.com/jonasCTDOL/fronteira-digital/blob/apis_externas/logo.png)

Uma aplicação web de código aberto para criar, salvar e compartilhar seus próprios mapas, inspirada no Google My Maps.

---

## ✨ Funcionalidades

- **Criação Livre:** Desenhe marcadores, linhas e polígonos diretamente no mapa com uma barra de ferramentas intuitiva.
- **Editor de Propriedades:** Clique em qualquer desenho para adicionar um título e uma descrição, transformando formas em informações ricas.
- **Persistência de Dados:** Sistema de login e registro de usuários. Seus mapas são salvos automaticamente e carregados sempre que você retorna.
- **Exportação de Dados:** Exporte todos os seus desenhos e dados para um arquivo `GeoJSON` padrão com um único clique.
- **Arquitetura Moderna:** Construído com uma arquitetura de microsserviços utilizando Docker, garantindo portabilidade e facilidade de desenvolvimento.

---

## 🛠️ Tecnologias Utilizadas

- **Containerização:** Docker & Docker Compose
- **Banco de Dados:** PostgreSQL + PostGIS
- **Backend (API):** Node.js + Express.js
- **Frontend:** HTML5, CSS3, JavaScript
- **Mapa:** Leaflet.js + Leaflet.draw
- **Proxy Reverso:** Nginx

---

## 🚀 Como Começar

Siga estes passos para executar o projeto localmente.

### Pré-requisitos

- [Docker](https://www.docker.com/products/docker-desktop/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados e em execução.

### Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
    cd SEU_REPOSITORIO
    ```

2.  **Crie o arquivo de ambiente:**
    Na raiz do projeto, crie um arquivo chamado `.env` e adicione o seguinte conteúdo:

    ```ini
    # Segredos para o Ambiente de Desenvolvimento
    POSTGRES_USER=carcara_user
    POSTGRES_PASSWORD=senha_super_secreta_trocar_depois
    POSTGRES_DB=fronteira_digital
    JWT_SECRET=outro_segredo_muito_forte_para_jwt_trocar
    ```

3.  **Inicie a aplicação:**
    Execute o comando abaixo para construir e iniciar todos os serviços.

    ```bash
    docker-compose up --build -d
    ```

4.  **Acesse a aplicação:**
    Abra seu navegador e acesse **[http://localhost](http://localhost)**. Você será redirecionado para a página de login. Crie uma conta e comece a mapear!

---

## 📁 Estrutura dos Serviços

O projeto é dividido em serviços independentes que se comunicam entre si:

-   `./frontend/`: A interface do usuário em HTML/JS/CSS, servida por um container Nginx.
-   `./api/`: A API em Node.js que gerencia os usuários e os dados geográficos.
-   `./proxy/`: Um container Nginx que atua como proxy reverso, direcionando o tráfego para a API ou para o frontend.
-   `db` (sem pasta): Um serviço do Docker que executa a imagem do PostGIS.

---

## 📄 Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
