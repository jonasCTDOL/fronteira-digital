![Texto Alternativo](https://github.com/jonasCTDOL/fronteira-digital/blob/apis_externas/logo.png)

# Guia Detalhado de Configuração e Uso do uMap com Docker

Este guia oferece uma visão abrangente sobre a construção, configuração e execução de uma instância do uMap utilizando Docker e Docker Compose, ideal para desenvolvimento local e preparação para deploy.

## 1. Visão Geral da Aplicação

O uMap é uma ferramenta de código aberto que permite criar mapas personalizados com camadas interativas, marcadores e dados geográficos. Esta configuração utiliza Docker para isolar o ambiente da aplicação, garantindo consistência e facilidade de gerenciamento.

### Componentes da Solução:
- **uMap Application:** A aplicação principal do uMap, baseada em Python/Django.
- **PostgreSQL:** Banco de dados relacional utilizado pelo uMap para armazenar dados de mapas, usuários, etc.
- **Nginx:** Servidor web reverso que atua como proxy para a aplicação uMap, gerenciando requisições HTTP e servindo arquivos estáticos.
- **Docker Compose:** Ferramenta para definir e executar aplicações Docker multi-container.

## 2. Pré-requisitos

Para seguir este guia, você precisará ter os seguintes softwares instalados em sua máquina:

- **Docker:** Motor de containerização.
- **Docker Compose:** Ferramenta para orquestração de containers Docker.

Você pode baixar e instalar ambos a partir do site oficial do Docker: [https://www.docker.com/get-started](https://www.docker.com/get-started)

## 3. Estrutura do Projeto

Certifique-se de que seu diretório de projeto contenha os seguintes arquivos:

```
.
├── .env                  # Variáveis de ambiente para o Docker Compose
├── docker-compose.yml    # Definição dos serviços Docker
├── nginx.conf            # Configuração do Nginx
├── readme.txt            # Este arquivo
└── umap.conf             # Configurações específicas do uMap (Python)
```

## 4. Configuração Detalhada

### 4.1. Arquivo `.env`

Este arquivo armazena variáveis de ambiente que serão utilizadas pelo `docker-compose.yml`. É crucial para a segurança e flexibilidade da sua aplicação.

Exemplo de conteúdo para `.env`:

```dotenv
# Variáveis para o banco de dados PostgreSQL
POSTGRES_DB=umap_db
POSTGRES_USER=umap_user
POSTGRES_PASSWORD=uma_senha_segura_para_o_banco

# Variáveis para a aplicação uMap
UMAP_SECRET_KEY=uma_chave_secreta_longa_e_aleatoria_para_o_umap
UMAP_SITE_URL=http://localhost:8001/
```

**Importante:**
- `POSTGRES_PASSWORD`: Altere para uma senha forte e única.
- `UMAP_SECRET_KEY`: Gere uma chave secreta longa e aleatória. Você pode usar ferramentas online para isso ou um comando Python como `import os; print(os.urandom(50))` para gerar uma base.

### 4.2. Arquivo `umap.conf`

Este arquivo é um script Python que define configurações específicas para a aplicação uMap. Ele é montado como um volume dentro do container do uMap.

Exemplo de conteúdo para `umap.conf`:

```python
# Gere uma chave longa e aleatória para produção.
# Esta chave deve ser a mesma definida em UMAP_SECRET_KEY no arquivo .env
SECRET_KEY = "${UMAP_SECRET_KEY}"

# Configurações específicas do uMap
UMAP_SETTINGS = {
    # URL pública pela qual o uMap será acessado.
    "SITE_URL": "${UMAP_SITE_URL}",
    # Outras configurações podem ser adicionadas aqui, como provedores de autenticação, etc.
}

# Configurações de banco de dados (serão sobrescritas pelo Docker Compose)
# DATABASE_URL = "postgis://umap_user:uma_senha_segura_para_o_banco@db:5432/umap_db"
```

**Observações:**
- As variáveis `${UMAP_SECRET_KEY}` e `${UMAP_SITE_URL}` serão substituídas pelos valores definidos no arquivo `.env` pelo Docker Compose.
- A seção `DATABASE_URL` é comentada porque o Docker Compose geralmente gerencia a conexão com o banco de dados através de variáveis de ambiente específicas do container.

### 4.3. Arquivo `nginx.conf`

Este arquivo configura o servidor web Nginx para atuar como um proxy reverso para a aplicação uMap. Ele também é responsável por servir arquivos estáticos.

Exemplo de conteúdo para `nginx.conf`:

```nginx
upstream umap {
    server umap:8000; # O nome 'umap' refere-se ao serviço definido no docker-compose.yml
}

server {
    listen 80;
    server_name localhost; # Pode ser o IP ou domínio da sua aplicação

    location / {
        proxy_pass http://umap;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Configuração para servir arquivos estáticos (se necessário)
    # location /static/ {
    #     alias /srv/umap/static/; # Caminho dentro do container do uMap
    # }
}
```

**Observações:**
- `server umap:8000;`: `umap` é o nome do serviço da aplicação uMap no `docker-compose.yml`, e `8000` é a porta interna que o uMap escuta.
- `listen 80;`: O Nginx escutará na porta 80.
- `server_name localhost;`: Para uso local, `localhost` é suficiente. Para deploy, você usaria seu domínio ou IP.

### 4.4. Arquivo `docker-compose.yml`

Este é o coração da sua configuração Docker, definindo todos os serviços, redes e volumes necessários.

Exemplo de conteúdo para `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgis/postgis:13-3.1 # Imagem do PostgreSQL com extensão PostGIS
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data # Persistência dos dados do banco
    restart: always

  umap:
    image: umap/umap:latest # Imagem oficial do uMap
    environment:
      DATABASE_URL: postgis://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      UMAP_SETTINGS_FILE: /srv/umap/umap.conf # Caminho do arquivo de configuração dentro do container
      SECRET_KEY: ${UMAP_SECRET_KEY}
    volumes:
      - ./umap.conf:/srv/umap/umap.conf # Monta seu arquivo umap.conf no container
    depends_on:
      - db
    restart: always

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf # Monta seu arquivo nginx.conf
    ports:
      - "8001:80" # Mapeia a porta 8001 da sua máquina para a porta 80 do Nginx
    depends_on:
      - umap
    restart: always

volumes:
  db_data: # Volume para persistir os dados do PostgreSQL
```

**Observações:**
- **`db` service:** Utiliza a imagem `postgis/postgis` que já inclui a extensão PostGIS, essencial para o uMap. As variáveis de ambiente são carregadas do `.env`.
- **`umap` service:** Utiliza a imagem oficial do uMap. A `DATABASE_URL` é construída usando as variáveis do `.env` e o nome do serviço `db`. O arquivo `umap.conf` local é montado dentro do container.
- **`nginx` service:** Utiliza a imagem oficial do Nginx. Seu `nginx.conf` local é montado no container. A porta `8001` da sua máquina é mapeada para a porta `80` do Nginx, permitindo acesso via `http://localhost:8001`.

## 5. Iniciando a Aplicação Localmente

Com todos os arquivos de configuração prontos, você pode iniciar a aplicação.

1.  **Navegue até o diretório do projeto** no seu terminal.

2.  **Inicie os serviços Docker:**

    ```bash
    docker-compose up -d
    ```
    Este comando irá:
    - Baixar as imagens Docker necessárias (se ainda não as tiver).
    - Criar e iniciar os containers para o banco de dados (`db`), aplicação uMap (`umap`) e Nginx (`nginx`).
    - Executar os containers em segundo plano (`-d` de "detached").

    Se você precisar aplicar novas configurações ou recriar os containers (por exemplo, após modificar `docker-compose.yml` ou `umap.conf`), use:

    ```bash
    docker-compose up -d --force-recreate
    ```

## 6. Criando um Superusuário

Após a aplicação estar em execução, você precisará criar um superusuário para acessar o painel administrativo do uMap.

Execute o seguinte comando:

```bash
docker-compose exec umap umap createsuperuser
```

O terminal solicitará que você insira um nome de usuário, e-mail e senha para o novo administrador.

## 7. Acessando o uMap

Com o superusuário criado, você pode acessar sua instância do uMap no seu navegador:

[http://localhost:8001/](http://localhost:8001/)

## 8. Parando a Aplicação

Para parar e remover os containers (mas manter os volumes de dados do banco de dados), execute:

```bash
docker-compose down
```

Para parar e remover os containers e **todos os volumes de dados** (útil para começar do zero), execute:

```bash
docker-compose down -v
```

## 9. Solução de Problemas (Troubleshooting)

### Erro de "No such file or directory" no Windows com Git Bash

Ao usar o Git Bash no Windows, você pode encontrar erros como `ls: cannot access 'C:/Program Files/Git/srv': No such file or directory` ao executar comandos `docker-compose exec` com caminhos absolutos (que começam com `/`).

Isso ocorre porque o Git Bash converte automaticamente esses caminhos para o formato do Windows.

**Solução:** Adicione uma barra extra no início do caminho para evitar a conversão.

**Exemplo:**
```bash
# Em vez de /srv/umap, use //srv/umap
docker-compose exec umap ls -l //srv/umap
```

## Próximas Etapas

### 1. Repositório GitHub

O repositório GitHub para este projeto pode ser encontrado em: [https://github.com/jonasCTDOL/fronteira-digital](https://github.com/jonasCTDOL/fronteira-digital)

### 2. Tutorial de Deploy na VPS da Hostgator

Este guia detalha os passos para realizar o deploy da sua aplicação uMap em uma Virtual Private Server (VPS) da Hostgator, garantindo que ela esteja acessível publicamente.

#### 2.1. Pré-requisitos na VPS

Antes de começar, certifique-se de que sua VPS Hostgator esteja configurada com:

- **Acesso SSH:** Você precisará acessar a VPS via SSH.
- **Sistema Operacional Atualizado:** Recomenda-se um sistema operacional Linux (ex: Ubuntu, CentOS) atualizado.
- **Docker e Docker Compose Instalados:** Siga as instruções oficiais para instalar Docker e Docker Compose na sua VPS. Geralmente, os passos são:

    ```bash
    # Atualizar pacotes
    sudo apt update && sudo apt upgrade -y

    # Instalar Docker
    sudo apt install docker.io -y
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER # Adiciona seu usuário ao grupo docker para evitar usar sudo
    newgrp docker # Aplica as mudanças de grupo imediatamente

    # Instalar Docker Compose (verifique a versão mais recente no GitHub do Docker Compose)
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.2.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    docker-compose --version
    ```

#### 2.2. Transferindo os Arquivos do Projeto para a VPS

Você pode clonar seu repositório GitHub diretamente na VPS:

1.  **Acesse sua VPS via SSH:**

    ```bash
    ssh seu_usuario@seu_ip_da_vps
    ```

2.  **Clone o repositório:**

    ```bash
    git clone https://github.com/jonasCTDOL/fronteira-digital.git
    cd fronteira-digital
    ```

#### 2.3. Configurações para Produção

É crucial ajustar as configurações para o ambiente de produção.

1.  **Edite o arquivo `.env`:**

    - `UMAP_SITE_URL`: Altere para o domínio ou IP público da sua VPS (ex: `https://seusite.com` ou `http://seu_ip_da_vps`).
    - `UMAP_SECRET_KEY`: Certifique-se de que esta chave seja longa, aleatória e **diferente** da usada em desenvolvimento.
    - `POSTGRES_PASSWORD`: Use uma senha forte e única para o banco de dados.

2.  **Edite o arquivo `umap.conf`:**

    - Verifique se `SECRET_KEY` e `SITE_URL` estão corretamente referenciando as variáveis de ambiente (ex: `SECRET_KEY = "${UMAP_SECRET_KEY}"`).

3.  **Edite o arquivo `nginx.conf`:**

    - `server_name`: Altere `localhost` para o seu domínio (ex: `seusite.com www.seusite.com`) ou o IP da sua VPS.
    - **Configuração HTTPS (Recomendado):** Para um ambiente de produção, é altamente recomendável configurar HTTPS. Isso geralmente envolve a obtenção de um certificado SSL (por exemplo, via Let's Encrypt com Certbot) e a modificação do `nginx.conf` para redirecionar HTTP para HTTPS e configurar o SSL. Este processo está além do escopo deste guia inicial, mas é uma etapa crítica para a segurança.

#### 2.4. Iniciando a Aplicação na VPS

No diretório do projeto na sua VPS, execute:

```bash
docker-compose up -d
```

Isso iniciará todos os serviços (banco de dados, uMap, Nginx) em segundo plano.

#### 2.5. Criando o Superusuário

Assim como no ambiente local, crie um superusuário para gerenciar o uMap:

```bash
docker-compose exec umap umap createsuperuser
```

#### 2.6. Configuração de Domínio e DNS

- **Apontar seu domínio:** No painel de controle do seu registrador de domínio (ex: Hostgator), crie um registro `A` que aponte seu domínio (e `www.seu_dominio.com`) para o IP público da sua VPS.
- **Firewall:** Certifique-se de que as portas 80 (HTTP) e 443 (HTTPS, se configurado) estejam abertas no firewall da sua VPS.

Com essas etapas, sua aplicação uMap estará rodando na sua VPS e acessível através do seu domínio.
