import { fireEvent, screen } from '@testing-library/vue';
import AuthSelector from '@/components/ui/AuthSelector.vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';

const loginViewTitle = 'Welcome Back!';
const registerViewTitle = 'Sign up';
const forgotPasswordViewTitle = 'Forgot Password?';

describe('AuthSelector', () => {
  describe('AuthSelector renders expected views', () => {
    it('Renders Login view by default', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        props: {},
      });
      getByText(loginViewTitle);
    });

    it('Renders Login view for init prop', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        props: { init: 'login-per-default' },
      });
      getByText(loginViewTitle);
    });

    it('Renders Register view for init prop', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        props: { init: 'register' },
      });
      getByText(registerViewTitle);
    });

    it('Renders Forgot Password view for init prop', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        props: { init: 'forgot-password' },
      });
      getByText(forgotPasswordViewTitle);
    });
  });

  describe('AuthSelector navigation with internal state', () => {
    it('Navigates from Login view to Register view when user clicks Register now button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        props: {},
      });
      getByText(loginViewTitle);
      const button = getByText('Register now');
      await fireEvent.click(button);
      getByText(registerViewTitle);
    });

    it('Navigates from Login view to Forgot Password view when user clicks Forgot Password button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        props: {},
      });
      await fireEvent.click(screen.getByTestId('toggle-method'));
      getByText(loginViewTitle);
      const button = getByText('Forgot password?');
      await fireEvent.click(button);
      getByText(forgotPasswordViewTitle);
    });

    it('Navigates from Register view to Login view when user clicks Sign in button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        props: { init: 'register' },
      });
      getByText(registerViewTitle);
      const button = getByText('Already have an account?');
      await fireEvent.click(button);
      getByText(loginViewTitle);
    });

    it('Navigates from Forgot Password view to Login view when user clicks Sign in button', async () => {
      const { getByText } = renderWithVuetify(AuthSelector, {
        props: { init: 'forgot-password' },
      });
      getByText(forgotPasswordViewTitle);
      const button = getByText('Back to login');
      await fireEvent.click(button);
      getByText(loginViewTitle);
    });
  });
});
