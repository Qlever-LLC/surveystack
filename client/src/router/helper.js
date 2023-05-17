import Navbar from '@/components/Navbar.vue';
import store from '@/store';

const commonComponents = {
  navbar: Navbar,
};

function getComponents(component, defaultComponents = commonComponents) {
  return {
    default: component,
    ...defaultComponents,
  };
}

const guard = async (to, from, next) => {
  if (!store.getters['auth/isLoggedIn']) {
    next({ name: 'auth-login', params: { redirect: to } });
  } else {
    next();
  }
};

const superGuard = async (to, from, next) => {
  if (!store.getters['auth/isSuperAdmin']) {
    next({ name: 'unauthorized', params: { allowed: 'Super Admins', to } });
  } else {
    next();
  }
};

export { getComponents, guard, superGuard };
