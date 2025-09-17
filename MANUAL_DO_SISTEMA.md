# Manual do Sistema: Projeto Fronteira Digital (Meu Mapa)

**Versão:** 2.0
**Data:** 17 de Setembro de 2025

## 1. Visão Geral

Este documento descreve a arquitetura e o funcionamento do sistema **Fronteira Digital**, uma aplicação web inspirada no Google My Maps. A plataforma permite que usuários autenticados criem, salvem, editem e exportem mapas personalizados, adicionando pontos, linhas e polígonos com títulos e descrições.

O sistema foi projetado com uma arquitetura de microsserviços containerizados, garantindo portabilidade e escalabilidade.

---

## 2. Arquitetura do Sistema

A aplicação é composta por quatro serviços principais, orquestrados com Docker Compose:

-   **Frontend:** Uma interface de usuário (UI) construída com HTML, CSS e JavaScript puro. Utiliza a biblioteca **Leaflet.js** para renderização de mapas e o plugin **Leaflet-draw** para as ferramentas de desenho. É responsável por toda a interação com o usuário.

-   **Backend (API):** Um servidor Node.js com Express.js. Ele gerencia a lógica de negócio, incluindo:
    -   Autenticação de usuários (registro e login com JWT).
    -   Operações CRUD (Criar, Ler, Atualizar, Deletar) para os dados geográficos dos usuários.

-   **Banco de Dados (DB):** Um banco de dados PostgreSQL com a extensão **PostGIS**, otimizado para armazenar e consultar dados geoespaciais. Ele persiste as informações de usuários e as geometrias (desenhos) criadas.

-   **Proxy:** Um servidor Nginx que atua como proxy reverso. Ele recebe todas as requisições externas e as direciona para o serviço apropriado (frontend ou API), além de servir como ponto de entrada único para a aplicação.

---

## 3. Funcionalidades Principais

-   **Autenticação de Usuário:** O acesso ao sistema é protegido. Novos usuários podem se registrar, e usuários existentes podem fazer login para acessar seus mapas.
-   **Criação de Desenhos:** Uma barra de ferramentas flutuante permite ao usuário desenhar marcadores (pontos), polilinhas (linhas) e polígonos diretamente no mapa.
-   **Edição de Propriedades:** Ao clicar em qualquer desenho, um pop-up é exibido, permitindo ao usuário adicionar e salvar um **título** e uma **descrição**, transformando formas em pontos de interesse.
-   **Persistência Automática:** Todos os desenhos e edições de propriedades são salvos automaticamente no banco de dados do usuário. Ao recarregar a página, todos os dados são restaurados no mapa.
-   **Exportação para GeoJSON:** Um botão "Exportar GeoJSON" permite ao usuário baixar um arquivo contendo todos os seus desenhos e propriedades, garantindo portabilidade e backup dos dados.

---

## 4. Configuração e Execução

### Pré-requisitos

-   Docker e Docker Compose instalados e em execução.

### Passos para Execução

1.  **Arquivo de Ambiente (`.env`):**
    Na raiz do projeto, crie um arquivo chamado `.env` com o seguinte conteúdo. Substitua os valores conforme necessário.

    ```ini
    # Segredos para o Ambiente de Desenvolvimento
    POSTGRES_USER=carcara_user
    POSTGRES_PASSWORD=senha_super_secreta_trocar_depois
    POSTGRES_DB=fronteira_digital
    JWT_SECRET=outro_segredo_muito_forte_para_jwt_trocar
    ```

2.  **Iniciar a Aplicação:**
    Abra um terminal na raiz do projeto e execute o seguinte comando:

    ```bash
    docker-compose up --build -d
    ```
    Este comando irá construir as imagens dos serviços (se necessário) e iniciar todos os contêineres em segundo plano.

3.  **Acessar o Sistema:**
    Abra seu navegador e acesse **`http://localhost`**. Você será direcionado para a página de login.

---

## 5. Arquivos de Configuração Chave

Abaixo estão as configurações atuais dos principais arquivos que definem a arquitetura do sistema.

#### `docker-compose.yml`
```yaml
version: '3.8'
services:
  db:
    image: postgis/postgis:15-3.3
    container_name: carcara_db
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
  api:
    build: ./api
    container_name: carcara_api
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3000
    depends_on: {db: {condition: service_healthy}}
    restart: unless-stopped
  frontend:
    build: ./frontend
    container_name: carcara_frontend
    restart: unless-stopped
  proxy:
    image: nginx:latest
    container_name: carcara_proxy
    ports: ["80:80", "443:443"]
    volumes: ['./proxy/nginx.conf:/etc/nginx/nginx.conf']
    depends_on: [frontend, api]
    restart: unless-stopped
volumes:
  postgres_data:
```

#### `proxy/nginx.conf`
```nginx
events {}
http {
    server {
        listen 80;
        server_name fd.ctdol.com.br www.fd.ctdol.com.br;
        location / { proxy_pass http://frontend; }
        location /api/ { proxy_pass http://api:3000/; }
        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;
    }
}
```
