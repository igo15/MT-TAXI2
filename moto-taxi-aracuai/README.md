# 🛵 Moto Táxi Araçuaí

Aplicativo de moto-táxi **exclusivo para Araçuaí – MG**.

Cliente solicita a corrida, mototaxista aceita, acompanha no mapa com avatar animado, escolhe Pix ou dinheiro e recebe notificações sonoras em cada etapa.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green?logo=spring)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-Map-green)

---

## ✨ Funcionalidades

### App do Cliente (`index.html`)
- Login e senha
- Origem e destino (com favoritos rápidos)
- Cálculo de preço: **R$ 4,00 por km**
- Escolha de pagamento: **Pix** ou **Dinheiro**
- Busca animada de mototaxista
- Avatar animado 🛵 se movendo no mapa até a origem
- Valor atualizado em tempo real
- Favoritar mototaxista
- Cancelar corrida
- Notificações sonoras

### App do Mototaxista (`motorista.html`)
- Login exclusivo para motoristas
- Ficar online / offline
- Receber corridas solicitadas automaticamente
- Aceitar ou recusar
- Ver origem, destino, distância e valor
- Fluxo: Cheguei → Iniciar viagem → Finalizar
- Notificação sonora de nova corrida

### Backend (Java Spring Boot)
- API REST completa
- Banco H2 em memória (fácil de testar)
- Login de cliente e motorista
- CRUD de corridas e status
- Cálculo de distância (Haversine + fator de ruas)
- Dados de demonstração já carregados

---

## 🚀 Como rodar

### 1. Backend

Requisitos: **Java 17+** e **Maven**

```bash
cd backend
mvn spring-boot:run
```

Servidor: [http://localhost:8080](http://localhost:8080)

### 2. Frontend

```bash
# Na pasta raiz do projeto
python3 -m http.server 3000
```

Abra no navegador:
- **Cliente:** [http://localhost:3000](http://localhost:3000)
- **Mototaxista:** [http://localhost:3000/motorista.html](http://localhost:3000/motorista.html)

> O frontend também funciona abrindo o `index.html` direto no navegador (modo demonstração, sem backend).

---

## 👤 Logins de teste

| Login    | Senha | Tipo       |
|----------|-------|------------|
| `cliente`| `123` | Cliente    |
| `joao`   | `123` | Mototaxista|
| `carlos` | `123` | Mototaxista|
| `pedro`  | `123` | Mototaxista|

---

## 🧪 Fluxo de teste completo

1. Suba o **backend**
2. Abra o app do **mototaxista** → login `joao` → **Ficar Online**
3. Abra o app do **cliente** → login `cliente`
4. Informe destino → Calcular → escolher Pix ou Dinheiro → **Solicitar Moto**
5. No app do mototaxista a corrida aparece → **Aceitar**
6. Acompanhe o avatar no mapa e as notificações sonoras
7. Finalize a corrida no app do mototaxista

---

## 📡 API (principais endpoints)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/corridas` | Solicitar corrida |
| GET | `/api/corridas/{id}` | Status da corrida |
| GET | `/api/corridas/solicitadas` | Lista para motoristas |
| PUT | `/api/corridas/{id}/aceitar` | Aceitar corrida |
| PUT | `/api/corridas/{id}/status` | Atualizar status |
| PUT | `/api/corridas/{id}/cancelar` | Cancelar |
| GET | `/api/motoristas/livres` | Motoristas disponíveis |
| PUT | `/api/motoristas/{id}/status` | Online / Offline / Em corrida |

### Exemplo – solicitar corrida

```json
POST /api/corridas
{
  "clienteId": 1,
  "origemEndereco": "Praça da Matriz, Araçuaí",
  "origemLat": -16.8495,
  "origemLng": -42.0650,
  "destinoEndereco": "Hospital São José",
  "destinoLat": -16.8520,
  "destinoLng": -42.0580,
  "formaPagamento": "PIX"
}
```

### Status da corrida

`SOLICITADA` → `ACEITA` → `A_CAMINHO` → `EM_VIAGEM` → `FINALIZADA`  
(ou `CANCELADA`)

---

## 💰 Preço

- **R$ 4,00 por quilômetro**
- Distância calculada com fórmula de Haversine + 15% de fator de ruas reais
- Valor atualiza conforme a quilometragem

---

## 🗺️ Cidade

Funciona apenas em **Araçuaí – Minas Gerais**.  
Mapa: OpenStreetMap via Leaflet.js  
Centro aproximado: `-16.85, -42.06`

---

## 🔊 Notificações sonoras

| Evento | Som |
|--------|-----|
| Corrida aceita | 3 notas ascendentes |
| Mototaxista chegou | 2 bipes + nota alta |
| Corrida finalizada | Escala de celebração |
| Nova corrida (motorista) | 3 bipes de alerta |
| Cancelamento | 2 notas graves |

Geradas com Web Audio API (sem arquivos externos).

---

## 📁 Estrutura do projeto

```
moto-taxi-aracuai/
├── index.html              # App do cliente
├── motorista.html          # App do mototaxista
├── css/
│   ├── style.css
│   └── motorista.css
├── js/
│   ├── app.js              # Lógica do cliente
│   ├── motorista.js        # Lógica do mototaxista
│   └── sounds.js           # Notificações sonoras
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/aracuai/mototaxi/
│       ├── controller/
│       ├── model/
│       ├── service/
│       ├── repository/
│       ├── dto/
│       └── config/
├── README.md
└── .gitignore
```

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5, CSS3, JavaScript |
| Mapa | Leaflet.js + OpenStreetMap |
| Backend | Java 17, Spring Boot 3.2 |
| Banco | H2 (memória) / JPA |
| Áudio | Web Audio API |

---

## 📌 Próximos passos (ideias)

- [ ] WebSocket para atualização em tempo real (sem polling)
- [ ] Histórico de ganhos do mototaxista
- [ ] Integração real com Pix
- [ ] Notificações push
- [ ] App nativo (Android) com o mesmo backend
- [ ] Avaliação após a corrida

---

## 📄 Licença

Projeto de demonstração / estudo.  
Feito para a cidade de **Araçuaí – MG** 💚
