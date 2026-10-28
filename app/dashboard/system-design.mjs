export const teachingFormat = [
  "Real-world problem",
  "How the famous company approaches it",
  "System architecture diagram",
  "Step-by-step data flow",
  "Technologies and design tradeoffs",
  "What happens when the system fails?",
  "How to build a simplified version using AI",
  "Practical student exercise"
];

export const course = {
  "title": "System Design Masterclass",
  "subtitle": "How Real Tech Companies Work",
  "lessonMinutes": [
    8,
    12
  ],
  "sessions": [
    {
      "id": "session-01",
      "number": 1,
      "title": "System Design Foundations",
      "companies": [
        "Google",
        "Cloudflare"
      ],
      "color": "#c6b3ec",
      "lessons": [
        {
          "id": "lesson-001",
          "number": 1,
          "title": "What happens when you enter a URL?"
        },
        {
          "id": "lesson-002",
          "number": 2,
          "title": "How browser, frontend, backend and database communicate"
        },
        {
          "id": "lesson-003",
          "number": 3,
          "title": "Client-server architecture"
        },
        {
          "id": "lesson-004",
          "number": 4,
          "title": "HTTP, HTTPS, REST and WebSockets"
        },
        {
          "id": "lesson-005",
          "number": 5,
          "title": "DNS and domain resolution"
        },
        {
          "id": "lesson-006",
          "number": 6,
          "title": "IP addresses, ports and networking"
        },
        {
          "id": "lesson-007",
          "number": 7,
          "title": "Reverse proxies and API gateways"
        },
        {
          "id": "lesson-008",
          "number": 8,
          "title": "Monolith vs microservices"
        },
        {
          "id": "lesson-009",
          "number": 9,
          "title": "Latency, throughput and concurrency"
        },
        {
          "id": "lesson-010",
          "number": 10,
          "title": "Design your first end-to-end application"
        }
      ]
    },
    {
      "id": "session-02",
      "number": 2,
      "title": "Backend Architecture",
      "companies": [
        "Stripe",
        "GitHub"
      ],
      "color": "#a9cfc5",
      "lessons": [
        {
          "id": "lesson-011",
          "number": 11,
          "title": "How an API request travels through a backend"
        },
        {
          "id": "lesson-012",
          "number": 12,
          "title": "Authentication vs authorization"
        },
        {
          "id": "lesson-013",
          "number": 13,
          "title": "JWT, cookies and sessions"
        },
        {
          "id": "lesson-014",
          "number": 14,
          "title": "Role-based and attribute-based access"
        },
        {
          "id": "lesson-015",
          "number": 15,
          "title": "API versioning and pagination"
        },
        {
          "id": "lesson-016",
          "number": 16,
          "title": "Rate limiting and throttling"
        },
        {
          "id": "lesson-017",
          "number": 17,
          "title": "Background workers and job queues"
        },
        {
          "id": "lesson-018",
          "number": 18,
          "title": "Webhooks and event-driven architecture"
        },
        {
          "id": "lesson-019",
          "number": 19,
          "title": "Idempotency and retries"
        },
        {
          "id": "lesson-020",
          "number": 20,
          "title": "Build a production-style backend"
        }
      ]
    },
    {
      "id": "session-03",
      "number": 3,
      "title": "Databases and Data Engineering",
      "companies": [
        "Instagram",
        "Amazon"
      ],
      "color": "#e6c097",
      "lessons": [
        {
          "id": "lesson-021",
          "number": 21,
          "title": "SQL vs NoSQL databases"
        },
        {
          "id": "lesson-022",
          "number": 22,
          "title": "Database schema design"
        },
        {
          "id": "lesson-023",
          "number": 23,
          "title": "Indexes and query optimization"
        },
        {
          "id": "lesson-024",
          "number": 24,
          "title": "Transactions and ACID"
        },
        {
          "id": "lesson-025",
          "number": 25,
          "title": "Replication and read replicas"
        },
        {
          "id": "lesson-026",
          "number": 26,
          "title": "Sharding and partitioning"
        },
        {
          "id": "lesson-027",
          "number": 27,
          "title": "Connection pooling"
        },
        {
          "id": "lesson-028",
          "number": 28,
          "title": "Database migrations and backups"
        },
        {
          "id": "lesson-029",
          "number": 29,
          "title": "Consistency models and CAP tradeoffs"
        },
        {
          "id": "lesson-030",
          "number": 30,
          "title": "Design a scalable user database"
        }
      ]
    },
    {
      "id": "session-04",
      "number": 4,
      "title": "Scaling, Caching and Reliability",
      "companies": [
        "Netflix",
        "Cloudflare"
      ],
      "color": "#abc5ec",
      "lessons": [
        {
          "id": "lesson-031",
          "number": 31,
          "title": "Vertical vs horizontal scaling"
        },
        {
          "id": "lesson-032",
          "number": 32,
          "title": "Load balancers and health checks"
        },
        {
          "id": "lesson-033",
          "number": 33,
          "title": "Redis and in-memory caching"
        },
        {
          "id": "lesson-034",
          "number": 34,
          "title": "CDNs and edge caching"
        },
        {
          "id": "lesson-035",
          "number": 35,
          "title": "Cache invalidation strategies"
        },
        {
          "id": "lesson-036",
          "number": 36,
          "title": "Auto scaling and capacity planning"
        },
        {
          "id": "lesson-037",
          "number": 37,
          "title": "Circuit breakers and bulkheads"
        },
        {
          "id": "lesson-038",
          "number": 38,
          "title": "High availability and failover"
        },
        {
          "id": "lesson-039",
          "number": 39,
          "title": "Observability, logs, metrics and tracing"
        },
        {
          "id": "lesson-040",
          "number": 40,
          "title": "Design a million-user architecture"
        }
      ]
    },
    {
      "id": "session-05",
      "number": 5,
      "title": "WhatsApp and Real-Time Messaging",
      "companies": [
        "WhatsApp",
        "Discord"
      ],
      "color": "#d7a8bd",
      "lessons": [
        {
          "id": "lesson-041",
          "number": 41,
          "title": "How WhatsApp delivers messages"
        },
        {
          "id": "lesson-042",
          "number": 42,
          "title": "WebSocket connections at scale"
        },
        {
          "id": "lesson-043",
          "number": 43,
          "title": "One-to-one message delivery"
        },
        {
          "id": "lesson-044",
          "number": 44,
          "title": "Group messaging and fan-out"
        },
        {
          "id": "lesson-045",
          "number": 45,
          "title": "Online presence and last-seen"
        },
        {
          "id": "lesson-046",
          "number": 46,
          "title": "Delivery receipts and read receipts"
        },
        {
          "id": "lesson-047",
          "number": 47,
          "title": "Offline message queues"
        },
        {
          "id": "lesson-048",
          "number": 48,
          "title": "End-to-end encryption concepts"
        },
        {
          "id": "lesson-049",
          "number": 49,
          "title": "Media uploads and storage"
        },
        {
          "id": "lesson-050",
          "number": 50,
          "title": "Build a real-time chat clone"
        }
      ]
    },
    {
      "id": "session-06",
      "number": 6,
      "title": "YouTube, Netflix and Video Systems",
      "companies": [
        "YouTube",
        "Netflix",
        "Zoom"
      ],
      "color": "#c4cb91",
      "lessons": [
        {
          "id": "lesson-051",
          "number": 51,
          "title": "How YouTube uploads videos"
        },
        {
          "id": "lesson-052",
          "number": 52,
          "title": "Chunked and resumable uploads"
        },
        {
          "id": "lesson-053",
          "number": 53,
          "title": "Video encoding and transcoding"
        },
        {
          "id": "lesson-054",
          "number": 54,
          "title": "HLS and DASH streaming"
        },
        {
          "id": "lesson-055",
          "number": 55,
          "title": "Adaptive bitrate streaming"
        },
        {
          "id": "lesson-056",
          "number": 56,
          "title": "DRM, Widevine and FairPlay"
        },
        {
          "id": "lesson-057",
          "number": 57,
          "title": "CDNs for video delivery"
        },
        {
          "id": "lesson-058",
          "number": 58,
          "title": "Personalized video watermarking"
        },
        {
          "id": "lesson-059",
          "number": 59,
          "title": "Live streaming architecture"
        },
        {
          "id": "lesson-060",
          "number": 60,
          "title": "Build a secure recorded-class platform"
        }
      ]
    },
    {
      "id": "session-07",
      "number": 7,
      "title": "Uber, Google Maps and Location Systems",
      "companies": [
        "Uber",
        "Google Maps"
      ],
      "color": "#bcaee3",
      "lessons": [
        {
          "id": "lesson-061",
          "number": 61,
          "title": "How Uber finds nearby drivers"
        },
        {
          "id": "lesson-062",
          "number": 62,
          "title": "GPS and location updates"
        },
        {
          "id": "lesson-063",
          "number": 63,
          "title": "Geospatial indexes and databases"
        },
        {
          "id": "lesson-064",
          "number": 64,
          "title": "Nearest-neighbor search"
        },
        {
          "id": "lesson-065",
          "number": 65,
          "title": "Driver-rider matching"
        },
        {
          "id": "lesson-066",
          "number": 66,
          "title": "Trip lifecycle state machines"
        },
        {
          "id": "lesson-067",
          "number": 67,
          "title": "Route calculation and ETA"
        },
        {
          "id": "lesson-068",
          "number": 68,
          "title": "Dynamic pricing architecture"
        },
        {
          "id": "lesson-069",
          "number": 69,
          "title": "Real-time tracking and notifications"
        },
        {
          "id": "lesson-070",
          "number": 70,
          "title": "Build a live cab-tracking prototype"
        }
      ]
    },
    {
      "id": "session-08",
      "number": 8,
      "title": "Amazon, Flipkart and Payment Systems",
      "companies": [
        "Amazon",
        "Flipkart",
        "Stripe"
      ],
      "color": "#9ec8d3",
      "lessons": [
        {
          "id": "lesson-071",
          "number": 71,
          "title": "How Amazon handles product searches"
        },
        {
          "id": "lesson-072",
          "number": 72,
          "title": "Shopping cart architecture"
        },
        {
          "id": "lesson-073",
          "number": 73,
          "title": "Inventory reservation"
        },
        {
          "id": "lesson-074",
          "number": 74,
          "title": "Checkout workflow"
        },
        {
          "id": "lesson-075",
          "number": 75,
          "title": "Payment gateways and webhooks"
        },
        {
          "id": "lesson-076",
          "number": 76,
          "title": "Preventing duplicate payments"
        },
        {
          "id": "lesson-077",
          "number": 77,
          "title": "Order state machines"
        },
        {
          "id": "lesson-078",
          "number": 78,
          "title": "Distributed transactions and sagas"
        },
        {
          "id": "lesson-079",
          "number": 79,
          "title": "Flash sales and traffic spikes"
        },
        {
          "id": "lesson-080",
          "number": 80,
          "title": "Build an e-commerce checkout system"
        }
      ]
    },
    {
      "id": "session-09",
      "number": 9,
      "title": "Instagram, TikTok and Recommendation Systems",
      "companies": [
        "Instagram",
        "TikTok",
        "Pinterest"
      ],
      "color": "#d8b58c",
      "lessons": [
        {
          "id": "lesson-081",
          "number": 81,
          "title": "How Instagram stores posts"
        },
        {
          "id": "lesson-082",
          "number": 82,
          "title": "News feed generation"
        },
        {
          "id": "lesson-083",
          "number": 83,
          "title": "Fan-out on write vs fan-out on read"
        },
        {
          "id": "lesson-084",
          "number": 84,
          "title": "Followers and social graph"
        },
        {
          "id": "lesson-085",
          "number": 85,
          "title": "Likes, comments and counters"
        },
        {
          "id": "lesson-086",
          "number": 86,
          "title": "Image processing pipelines"
        },
        {
          "id": "lesson-087",
          "number": 87,
          "title": "Search and hashtag indexing"
        },
        {
          "id": "lesson-088",
          "number": 88,
          "title": "Recommendation candidate retrieval"
        },
        {
          "id": "lesson-089",
          "number": 89,
          "title": "Feed ranking and personalization"
        },
        {
          "id": "lesson-090",
          "number": 90,
          "title": "Build a personalized content feed"
        }
      ]
    },
    {
      "id": "session-10",
      "number": 10,
      "title": "Google Search, AI and LLM Systems",
      "companies": [
        "Google",
        "OpenAI",
        "Perplexity"
      ],
      "color": "#aebfb0",
      "lessons": [
        {
          "id": "lesson-091",
          "number": 91,
          "title": "How Google Search indexes websites"
        },
        {
          "id": "lesson-092",
          "number": 92,
          "title": "Web crawling and indexing"
        },
        {
          "id": "lesson-093",
          "number": 93,
          "title": "Inverted indexes and search ranking"
        },
        {
          "id": "lesson-094",
          "number": 94,
          "title": "Vector databases and embeddings"
        },
        {
          "id": "lesson-095",
          "number": 95,
          "title": "Semantic search architecture"
        },
        {
          "id": "lesson-096",
          "number": 96,
          "title": "Retrieval-augmented generation (RAG)"
        },
        {
          "id": "lesson-097",
          "number": 97,
          "title": "LLM inference and model serving"
        },
        {
          "id": "lesson-098",
          "number": 98,
          "title": "AI job queues and GPU scheduling"
        },
        {
          "id": "lesson-099",
          "number": 99,
          "title": "AI caching, safety and cost controls"
        },
        {
          "id": "lesson-100",
          "number": 100,
          "title": "Build an AI knowledge assistant"
        }
      ]
    },
    {
      "id": "session-11",
      "number": 11,
      "title": "Cloud, DevOps and Production Infrastructure",
      "companies": [
        "AWS",
        "Azure",
        "Google Cloud"
      ],
      "color": "#b9b8e7",
      "lessons": [
        {
          "id": "lesson-101",
          "number": 101,
          "title": "Virtual machines vs containers"
        },
        {
          "id": "lesson-102",
          "number": 102,
          "title": "Docker images and containers"
        },
        {
          "id": "lesson-103",
          "number": 103,
          "title": "Kubernetes architecture"
        },
        {
          "id": "lesson-104",
          "number": 104,
          "title": "CI/CD pipelines"
        },
        {
          "id": "lesson-105",
          "number": 105,
          "title": "Infrastructure as code"
        },
        {
          "id": "lesson-106",
          "number": 106,
          "title": "Object storage and signed URLs"
        },
        {
          "id": "lesson-107",
          "number": 107,
          "title": "Secrets management and IAM"
        },
        {
          "id": "lesson-108",
          "number": 108,
          "title": "Cloud networking and firewalls"
        },
        {
          "id": "lesson-109",
          "number": 109,
          "title": "Disaster recovery and deployment rollback"
        },
        {
          "id": "lesson-110",
          "number": 110,
          "title": "Deploy a full-stack app to Azure or AWS"
        }
      ]
    },
    {
      "id": "session-12",
      "number": 12,
      "title": "Advanced Distributed Systems and Capstone",
      "companies": [
        "Netflix",
        "Uber",
        "Stripe",
        "Google"
      ],
      "color": "#cfb098",
      "lessons": [
        {
          "id": "lesson-111",
          "number": 111,
          "title": "Distributed systems fundamentals"
        },
        {
          "id": "lesson-112",
          "number": 112,
          "title": "Consensus and leader election"
        },
        {
          "id": "lesson-113",
          "number": 113,
          "title": "Event sourcing and CQRS"
        },
        {
          "id": "lesson-114",
          "number": 114,
          "title": "Kafka and distributed messaging"
        },
        {
          "id": "lesson-115",
          "number": 115,
          "title": "Distributed locks and coordination"
        },
        {
          "id": "lesson-116",
          "number": 116,
          "title": "Multi-region architecture"
        },
        {
          "id": "lesson-117",
          "number": 117,
          "title": "Data privacy and threat modeling"
        },
        {
          "id": "lesson-118",
          "number": 118,
          "title": "SLOs, incident response and chaos testing"
        },
        {
          "id": "lesson-119",
          "number": 119,
          "title": "System design interview walkthrough"
        },
        {
          "id": "lesson-120",
          "number": 120,
          "title": "Capstone: architect an AI education platform"
        }
      ]
    }
  ]
};
