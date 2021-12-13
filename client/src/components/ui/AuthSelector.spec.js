import { fireEvent } from '@testing-library/vue';
import AuthSelector from '@/components/ui/AuthSelector.vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';

const store = {};
const noRoutes = [];

const loginViewTitle = 'Login';
const registerViewTitle = 'Sign up';
const forgotPasswordViewTitle = 'Forgot Password';

describe('AuthSelector', () => {
  describe('AuthSelector renders expected views', () => {
    it('Renders Login view by default', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: {},
        store,
        routes: noRoutes,
      });
      getByText(loginViewTitle);
    });
    it('Renders Login view for init prop', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: { init: 'login-per-default' },
        store,
        routes: noRoutes,
      });
      getByText(loginViewTitle);
    });
    it('Renders Register view for init prop', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: { init: 'register' },
        store,
        routes: noRoutes,
      });
      getByText(registerViewTitle);
    });
    it('Renders Forgot Password view for init prop', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: { init: 'forgot-password' },
        store,
        routes: noRoutes,
      });
      getByText(forgotPasswordViewTitle);
    });
  });

  describe('AuthSelector navigation with internal state', () => {
    it('Navigates from Login view to Register view when user clicks Register now button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: {},
        store,
        routes: noRoutes,
      });
      getByText(loginViewTitle);
      const button = getByText('Register now');
      await fireEvent.click(button);
      getByText(registerViewTitle);
    });
    it('Navigates from Login view to Forgot Password view when user clicks Forgot Password button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: {},
        store,
        routes: noRoutes,
      });
      getByText(loginViewTitle);
      const button = getByText('Forgot password?');
      await fireEvent.click(button);
      getByText(forgotPasswordViewTitle);
    });
    it('Navigates from Register view to Login view when user clicks Sign in button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: { init: 'register' },
        store,
        routes: noRoutes,
      });
      getByText(registerViewTitle);
      const button = getByText('Sign in');
      await fireEvent.click(button);
      getByText(loginViewTitle);
    });
    it('Navigates from Forgot Password view to Login view when user clicks Sign in button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: { init: 'forgot-password' },
        store,
        routes: noRoutes,
      });
      getByText(forgotPasswordViewTitle);
      const button = getByText('Sign in');
      await fireEvent.click(button);
      getByText(loginViewTitle);
    });
  });
});
