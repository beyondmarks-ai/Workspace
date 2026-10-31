import { course } from '../system-design.mjs';

const briefs = [
  {
    title: 'Your first launch',
    summary: 'Turn an idea into a tiny web application, and trace every request from the browser to the database.',
    steps: ['Build a reading-list page with a form to save a link.', 'Connect the page to a REST API and a small database.', 'Draw the journey of one request, including DNS, HTTPS and the server.'],
    goal: 'Save a link, refresh the browser and retrieve it again. Explain each stop along the way.',
  },
  {
    title: 'The booking desk',
    summary: 'Design an appointment-booking backend that stays predictable when requests are repeated.',
    steps: ['Create sign-in and separate student and administrator permissions.', 'Add paginated booking endpoints with validation and rate limits.', 'Queue a confirmation task and make booking retries idempotent.'],
    goal: 'Send the same booking request twice and prove that only one booking is created.',
  },
  {
    title: 'A better bookshelf',
    summary: 'Build a searchable library and learn what makes a database fast, consistent and recoverable.',
    steps: ['Model books, members and loans in a relational database.', 'Add an index and compare a search query before and after.', 'Use a transaction for borrowing, then back up and restore your data.'],
    goal: 'Two members cannot borrow the last available copy at the same time.',
  },
  {
    title: 'Built for a crowd',
    summary: 'Take a small link-shortening service from one server to a design that can handle a busy day.',
    steps: ['Create short links with a database-backed redirect endpoint.', 'Cache popular links and put two instances behind a load balancer.', 'Add health checks and observe latency during a local load test.'],
    goal: 'Stop one instance and show that redirects still work. Record the limits of your test.',
  },
  {
    title: 'The conversation',
    summary: 'Create a small real-time chat room with delivery states and a graceful offline experience.',
    steps: ['Connect two browsers using WebSockets and store messages.', 'Add delivery receipts and track online presence.', 'Queue messages for a disconnected client and deduplicate them on reconnect.'],
    goal: 'Disconnect a browser, send a message, reconnect and receive that message exactly once.',
  },
  {
    title: 'Your own cinema',
    summary: 'Build a recorded-class prototype that turns an uploaded video into an adaptive stream.',
    steps: ['Upload a sample video in resumable chunks.', 'Transcode it into two HLS quality levels with a background job.', 'Create a player with authorized playback and a visible student watermark.'],
    goal: 'Resume an interrupted upload and play the result at different network speeds.',
  },
  {
    title: 'Around the corner',
    summary: 'Simulate a nearby-driver map and explore how location changes move through a system.',
    steps: ['Generate simulated driver positions and store them with a geospatial index.', 'Find nearby drivers and implement a simple rider-driver match.', 'Show trip states and stream location updates onto a map.'],
    goal: 'Match a rider, animate a simulated trip and handle a driver disconnect without losing the trip.',
  },
  {
    title: 'The little store',
    summary: 'Create a checkout prototype that protects inventory and handles payment retries safely.',
    steps: ['Build a cart and reserve stock for a short checkout window.', 'Connect a payment provider in test mode and verify webhook signatures.', 'Track order states and release reservations after a failed or expired payment.'],
    goal: 'Replay a test payment webhook without creating a second order or reducing stock twice.',
  },
  {
    title: 'Made for you',
    summary: 'Build a personal learning feed that ranks useful posts instead of showing everything at once.',
    steps: ['Create posts, follows and a simple chronological feed.', 'Generate candidates from followed creators and selected interests.', 'Rank the candidates and explain why each item was recommended.'],
    goal: 'Two students with different interests see different feeds, with a readable reason for each suggestion.',
  },
  {
    title: 'The study companion',
    summary: 'Make a knowledge assistant that answers questions from your own class notes with source references.',
    steps: ['Split sample notes into chunks and index their embeddings.', 'Retrieve relevant passages and pass them to an LLM.', 'Show citations, set a request budget and handle questions the notes cannot answer.'],
    goal: 'Answer a question with a matching source passage and clearly say when the notes do not contain an answer.',
  },
  {
    title: 'Ready for the world',
    summary: 'Give one of your prototypes a repeatable deployment process and a reliable way back.',
    steps: ['Package the app with Docker and run checks in CI.', 'Deploy to a test cloud environment with managed secrets and restricted networking.', 'Add health checks, logs and a documented rollback procedure.'],
    goal: 'Deploy a change, detect a failed health check and restore the previous working version.',
  },
  {
    title: 'Beyond the classroom',
    summary: 'Bring the course together by architecting a resilient AI education platform.',
    steps: ['Map accounts, courses, payments, video processing and the AI assistant into services.', 'Define events, data ownership, privacy boundaries and failure recovery.', 'Build one end-to-end slice, then write SLOs and test a simulated service failure.'],
    goal: 'Demonstrate one complete student journey and explain how the design recovers when a dependency fails.',
  },
];

export const projectIdeas = briefs.map((brief, index) => ({
  ...brief,
  id: `project-${String(index + 1).padStart(2, '0')}`,
  number: index + 1,
  session: course.sessions[index],
  image: `/projects/${['coast', 'interior', 'stone', 'retreat'][index % 4]}.webp`,
  dark: index % 4 === 2,
}));
