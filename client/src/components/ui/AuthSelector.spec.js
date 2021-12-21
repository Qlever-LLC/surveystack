import { fireEvent, screen } from '@testing-library/vue';
import AuthSelector from '@/components/ui/AuthSelector.vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';

const store = {};
const noRoutes = [];

const pwLoginViewTitle = 'Welcome Back!';
const emailLoginViewTitle = 'Welcome!';
const forgotPasswordViewTitle = 'Forgot Password?';

describe('AuthSelector', () => {
  describe('AuthSelector renders expected views', () => {
    it('Renders Login view by default', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: {},
        store,
        routes: noRoutes,
      });
      getByText(emailLoginViewTitle);
    });
    it('Renders Login view for init prop', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: { init: 'login-per-default' },
        store,
        routes: noRoutes,
      });
      getByText(emailLoginViewTitle);
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
    it('Navigates from Login view to Forgot Password view when user clicks Forgot Password button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: {},
        store,
        routes: noRoutes,
      });
      await fireEvent.click(screen.getByTestId('toggle-method'));
      getByText(pwLoginViewTitle);
      const button = getByText('Forgot password?');
      await fireEvent.click(button);
      getByText(forgotPasswordViewTitle);
    });
    it('Navigates from Forgot Password view to Login view when user clicks Sign in button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        propsData: { init: 'forgot-password' },
        store,
        routes: noRoutes,
      });
      getByText(forgotPasswordViewTitle);
      const button = getByText('Back to login');
      await fireEvent.click(button);
      getByText(pwLoginViewTitle);
    });
  });
});
