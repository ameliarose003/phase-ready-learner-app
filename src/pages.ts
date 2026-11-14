import type { Component } from "vue";
import Page0 from './pages/admin/index.vue';
import Page1 from './pages/admin/phases/index.vue';
import Page2 from './pages/dashboard/index.vue';
import Page3 from './pages/lessons/index.vue';
import Page4 from './pages/lessons/upload-video/index.vue';
import Page5 from './pages/lessons/[id]/index.vue';
import Page6 from './pages/lessons/[id]/edit/index.vue';
import Page7 from './pages/lessons/[id]/update/index.vue';
import Page8 from './pages/login/index.vue';
import Page9 from './pages/logout/index.vue';
import Page10 from './pages/phases/index.vue';
import Page11 from './pages/phases/[id]/index.vue';
import Page12 from './pages/signup/index.vue';
import Page13 from './pages/users/index.vue';
import Page14 from './pages/users/[id]/edit/index.vue';
import Page15 from './pages/users/[id]/update/index.vue';
import Page16 from './pages/index.vue';
export const pages: Record<string, Component> = {
"src/pages/admin/index.vue": Page0,
"src/pages/admin/phases/index.vue": Page1,
"src/pages/dashboard/index.vue": Page2,
"src/pages/lessons/index.vue": Page3,
"src/pages/lessons/upload-video/index.vue": Page4,
"src/pages/lessons/[id]/index.vue": Page5,
"src/pages/lessons/[id]/edit/index.vue": Page6,
"src/pages/lessons/[id]/update/index.vue": Page7,
"src/pages/login/index.vue": Page8,
"src/pages/logout/index.vue": Page9,
"src/pages/phases/index.vue": Page10,
"src/pages/phases/[id]/index.vue": Page11,
"src/pages/signup/index.vue": Page12,
"src/pages/users/index.vue": Page13,
"src/pages/users/[id]/edit/index.vue": Page14,
"src/pages/users/[id]/update/index.vue": Page15,
"src/pages/index.vue": Page16
};
