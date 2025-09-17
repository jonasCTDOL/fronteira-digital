# Fronteira Digital 
![Texto Alternativo](https://github.com/jonasCTDOL/fronteira-digital/blob/apis_externas/logo.png)


-----

# **Sistema de Georreferenciamento Operacional - Projeto Carcará**

**Assunto:** Apresentação da plataforma de inteligência e planejamento geoespacial "Fronteira Digital".

-----

### **1. Sumário Executivo**

O Projeto Carcará, materializado na plataforma **Fronteira Digital**, é um sistema de mapeamento tático desenvolvido para fornecer ao comando e aos oficiais em campo uma ferramenta visual, segura e intuitiva para planejamento, execução e análise de operações policiais.

Inspirado na facilidade de uso de aplicações como o Google Maps, o sistema foi construído sob medida para as necessidades da segurança pública, permitindo que nossas equipes transformem dados brutos em inteligência acionável diretamente no mapa da nossa região.

*Sugestão de imagem: Um mapa da região com exemplos de polígonos de patrulha, marcadores de ocorrências e rotas planejadas.*

-----

### **2. O Desafio Operacional**

Atualmente, o planejamento de operações e a análise de padrões criminais muitas vezes dependem de múltiplas fontes de dados, mapas físicos ou sistemas complexos que não se comunicam. Isso pode resultar em:

  - Dificuldade para visualizar a "mancha criminal" de forma clara e atualizada.
  - Ineficiência no planejamento de rotas de patrulhamento e cercos táticos.
  - Falta de um repositório centralizado e visual para o histórico de operações.
  - Riscos de segurança ao utilizar ferramentas de mapeamento públicas e não controladas.

-----

### **3. A Solução: Plataforma Fronteira Digital**

O Fronteira Digital centraliza a inteligência geoespacial em um único ambiente controlado e seguro. A plataforma permite ao efetivo:

  - **Criar Mapas Táticos Dinâmicos:** Desenhar, com total liberdade, os elementos cruciais para uma operação.

      - **Marcadores:** Indicar pontos de interesse, locais de ocorrências (CVLI, roubos), endereços de suspeitos, postos de observação ou posicionamento de viaturas.
      - **Linhas:** Traçar rotas de patrulha, vias de fuga prováveis, trajetos para acompanhamento ou barreiras policiais.
      - **Polígonos:** Delimitar perímetros de segurança, áreas de saturação, zonas de responsabilidade de cada equipe (setorização) ou identificar visualmente as "zonas quentes" de criminalidade.

  - **Enriquecer o Mapa com Informações Críticas:** Cada elemento desenhado no mapa pode ser detalhado. Ao clicar em um marcador, por exemplo, o policial pode adicionar e consultar informações como número da ocorrência, data/hora, *modus operandi*, indivíduos envolvidos e outras observações relevantes.

  - **Construir uma Base de Conhecimento Operacional:** O sistema possui controle de acesso com login e senha. Todo mapa criado por um usuário autorizado é salvo de forma segura e permanente. Isso cria um valioso histórico de operações, permitindo análises futuras e o aprimoramento contínuo das nossas estratégias.

  - **Garantir a Compatibilidade e a Geração de Relatórios:** Os dados do mapa podem ser exportados em um formato universal (`GeoJSON`), permitindo que sejam utilizados em apresentações para o comando, relatórios de produtividade ou integrados com outros sistemas de análise, se necessário.

-----

### **4. Vantagens Estratégicas para o Comando**

A adoção do Projeto Carcará se traduz em benefícios diretos para a gestão e eficácia policial:

  - **Tomada de Decisão Acelerada:** Uma visão clara e unificada do cenário operacional permite que o comando tome decisões mais rápidas e bem-fundamentadas.
  - **Otimização de Recursos:** Facilita o emprego racional do efetivo e das viaturas, direcionando-os para as áreas e horários de maior necessidade com base em evidências visuais.
  - **Aumento da Consciência Situacional:** Todas as equipes podem, literalmente, "estar na mesma página", compartilhando um entendimento comum do terreno e do plano de ação.
  - **Segurança da Informação:** Por ser um sistema próprio, garantimos total controle sobre quem acessa os dados operacionais, mitigando o risco de vazamento de informações sensíveis.
  - **Memória Institucional:** Preserva o conhecimento tático das operações, facilitando o treinamento de novos oficiais e a análise de sucessos e fracassos.

-----

### **5. Fundamentos Técnicos**

A plataforma foi desenvolvida sobre uma arquitetura tecnológica moderna e robusta, garantindo **confiabilidade, segurança e autonomia**. Os dados são armazenados em um banco de dados georreferenciado (PostgreSQL/PostGIS) sob nosso total controle, assegurando a soberania sobre nossas informações de inteligência.

O sistema foi projetado para ser resiliente e estar sempre disponível, especialmente durante operações críticas.

## 📄 Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
