import * as route0 from './routes/admin-dashboard.js';
import * as route1 from './routes/manage-phases.js';
import * as route2 from './routes/current-user.js';
import * as route3 from './routes/learner-dashboard.js';
import * as route4 from './routes/lessons.js';
import * as route5 from './routes/create-lesson.js';
import * as route6 from './routes/read-lesson.js';
import * as route7 from './routes/delete-lesson.js';
import * as route8 from './routes/edit-lesson.js';
import * as route9 from './routes/update-lesson.js';
import * as route10 from './routes/login.js';
import * as route11 from './routes/logout.js';
import * as route12 from './routes/phases.js';
import * as route13 from './routes/read-phase.js';
import * as route14 from './routes/legacy-lessons.js';
import * as route15 from './routes/signup.js';
import * as route16 from './routes/users.js';
import * as route17 from './routes/delete-account.js';
import * as route18 from './routes/edit-account.js';
import * as route19 from './routes/update-account.js';

export const routes = [
 { path: "/admin", page: true, component: "src/pages/admin/index.vue", handlers: route0 },
 { path: "/admin/phases", page: true, component: "src/pages/admin/phases/index.vue", handlers: route1 },
 { path: "/api/me", page: false, component: "src/pages/api/me/index.vue", handlers: route2 },
 { path: "/dashboard", page: true, component: "src/pages/dashboard/index.vue", handlers: route3 },
 { path: "/lessons", page: true, component: "src/pages/lessons/index.vue", handlers: route4 },
 { path: "/lessons/upload-video", page: true, component: "src/pages/lessons/upload-video/index.vue", handlers: route5 },
 { path: "/lessons/[id]", page: true, component: "src/pages/lessons/[id]/index.vue", handlers: route6 },
 { path: "/lessons/[id]/delete", page: false, component: "src/pages/lessons/[id]/delete/index.vue", handlers: route7 },
 { path: "/lessons/[id]/edit", page: true, component: "src/pages/lessons/[id]/edit/index.vue", handlers: route8 },
 { path: "/lessons/[id]/update", page: true, component: "src/pages/lessons/[id]/update/index.vue", handlers: route9 },
 { path: "/login", page: true, component: "src/pages/login/index.vue", handlers: route10 },
 { path: "/logout", page: true, component: "src/pages/logout/index.vue", handlers: route11 },
 { path: "/phases", page: true, component: "src/pages/phases/index.vue", handlers: route12 },
 { path: "/phases/[id]", page: true, component: "src/pages/phases/[id]/index.vue", handlers: route13 },
 { path: "/podcasts/[...path]", page: false, component: "src/pages/podcasts/[...path]/index.vue", handlers: route14 },
 { path: "/signup", page: true, component: "src/pages/signup/index.vue", handlers: route15 },
 { path: "/users", page: true, component: "src/pages/users/index.vue", handlers: route16 },
 { path: "/users/[id]/delete", page: false, component: "src/pages/users/[id]/delete/index.vue", handlers: route17 },
 { path: "/users/[id]/edit", page: true, component: "src/pages/users/[id]/edit/index.vue", handlers: route18 },
 { path: "/users/[id]/update", page: true, component: "src/pages/users/[id]/update/index.vue", handlers: route19 },
 { path: "/", page: true, component: "src/pages/index.vue", handlers: {} }
];
