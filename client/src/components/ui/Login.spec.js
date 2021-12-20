import { fireEvent, screen } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import Login from './Login.vue';
import { RouterLinkStub } from '@vue/test-utils';
import mockAxios from 'axios';
jest.mock('@/utils/memberships');
import { autoSelectActiveGroup } from '@/utils/memberships';

const TransitionStub = {
  render(h) {
    return h('transition-stub', this.$slots.default);
  },
};

const switchLoginMethod = () => fireEvent.click(screen.getByTestId('toggle-method'));

beforeEach(() => localStorage.clear());

describe('Login component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to Forgot Password by default', async () => {
      const { getByRole } = renderWithVuetify(Login, {
        store: {},
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      await switchLoginMethod();
      getByRole('link', { name: 'Forgot password?' });
    });

    it('Renders button to Forgot Password when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(Login, {
        store: {},
        propsData: { useLink: false },
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      await switchLoginMethod();
      getByRole('button', { name: 'Forgot password?' });
    });
  });

  describe('submit form and check user fields', () => {
    it('shows an error when email is passed without password', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Login, {
        propsData: {},
        store: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      await switchLoginMethod();
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');
      expect(queryByText('Password must not be empty.')).toBeNull();
      const button = getByText('Login');
      await fireEvent.click(button);
      getByText('Password must not be empty.');
    });

    it('shows an error when password is passed without email', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Login, {
        propsData: {},
        store: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      await switchLoginMethod();
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'somePassword');
      expect(passwordInput.value).toBe('somePassword');
      expect(queryByText('E-Mail must not be empty.')).toBeNull();
      const button = getByText('Login');
      await fireEvent.click(button);
      getByText('E-Mail must not be empty.');
    });

    it('displays an error when incorrect password is submitted (status 401)', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        message: 'Invalid email or password',
        response: { status: 401 },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Login, {
        store: {
          actions: {
            'auth/login': authLoginMock,
            'surveys/fetchPinned': jest.fn(),
          },
        },
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');
      expect(emailInput.value).toBe('someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'wrongPassword');
      expect(pwdInput.value).toBe('wrongPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      await findByText('Invalid email or password');
    });

    it('displays an error when incorrect email is submitted (status 404)', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        message: 'Invalid email or password',
        response: { status: 404 },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Login, {
        store: {
          actions: {
            'auth/login': authLoginMock,
            'surveys/fetchPinned': jest.fn(),
          },
        },
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'password');
      expect(pwdInput.value).toBe('password');

      const button = getByText('Login');
      await fireEvent.click(button);
      await findByText('Invalid email or password');
    });

    it('displays an error when an error occured on the login, that is different to 401 and 404 (ex: status 500)', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        message: 'An error occured',
        response: { status: 500 },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Login, {
        store: {
          actions: {
            'auth/login': authLoginMock,
            'surveys/fetchPinned': jest.fn(),
          },
        },
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      expect(emailInput.value).toBe('email@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'password');
      expect(pwdInput.value).toBe('password');

      const button = getByText('Login');
      await fireEvent.click(button);
      await findByText('An error occured');
    });
  });

  describe('submit form and check submit() method behaviour based on try to auto join group if this is a whitelabel', () => {
    it('submit and trying autojoin if this.isWhitelabel && this.registrationEnabled', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() => Promise.resolve());
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Login, {
        store: {
          getters: {
            'whitelabel/isWhitelabel': () => true,
            'whitelabel/partner': () => ({
              id: 1,
            }),
            'invitation/hasInvitation': () => false,
          },
          actions: {
            'auth/login': jest.fn(() => Promise.resolve()),
            'surveys/fetchPinned': jest.fn(),
          },
        },
        mocks: {
          $route: {
            params: { redirect: false },
            query: {},
          },
          $router: {
            push,
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      // wait for Promise for pending result
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(autoSelectActiveGroup).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith('/');
    });

    it('submit and trying autojoin if this.isWhitelabel && this.registrationEnabled BUT post throw an error', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() =>
        Promise.reject({
          response: { data: { message: 'an error message' } },
        })
      );
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Login, {
        store: {
          getters: {
            'whitelabel/isWhitelabel': () => true,
            'whitelabel/partner': () => ({
              id: 1,
            }),
            'invitation/hasInvitation': () => false,
          },
          actions: {
            'auth/login': jest.fn(() => Promise.resolve()),
            'surveys/fetchPinned': jest.fn(),
          },
        },
        mocks: {
          $route: {
            params: { redirect: false },
            query: {},
          },
          $router: {
            push,
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      // wait for Promise for pending result
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(autoSelectActiveGroup).toHaveBeenCalledTimes(0);
      expect(push).toHaveBeenCalledWith('/');
    });

    it('submit and trying autojoin if this.isWhitelabel === false', async () => {
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Login, {
        store: {
          getters: {
            'whitelabel/isWhitelabel': () => false,
            'invitation/hasInvitation': () => false,
          },
          actions: {
            'auth/login': jest.fn(() => Promise.resolve()),
            'surveys/fetchPinned': jest.fn(),
          },
        },
        mocks: {
          $route: {
            params: { redirect: false },
            query: {},
          },
          $router: {
            push,
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      // wait for Promise for pending result
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(autoSelectActiveGroup).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith('/');
    });
  });

  describe('submit form and check submit() method behaviour based on redirection', () => {
    it("submit and get the redirection '/' ", async () => {
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Login, {
        store: {
          getters: {
            'whitelabel/isWhitelabel': () => false,
            'invitation/hasInvitation': () => false,
          },
          actions: {
            'auth/login': jest.fn(() => Promise.resolve()),
            'surveys/fetchPinned': jest.fn(),
          },
        },
        mocks: {
          $route: {
            params: { redirect: false },
            query: {},
          },
          $router: {
            push,
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      // wait for Promise for pending result
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(push).toHaveBeenCalledWith('/');
    });

    it("submit and get the redirection 'this.$route.params.redirect = true' ", async () => {
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Login, {
        store: {
          getters: {
            'whitelabel/isWhitelabel': () => false,
            'invitation/hasInvitation': () => false,
          },
          actions: {
            'auth/login': jest.fn(() => Promise.resolve()),
            'surveys/fetchPinned': jest.fn(),
          },
        },
        mocks: {
          $route: {
            params: { redirect: true },
            query: {},
          },
          $router: {
            push,
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      // wait for Promise for pending result
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(push).toHaveBeenCalledWith(true);
    });

    it("submit and get the redirection 'name: 'invitations' & code' ", async () => {
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Login, {
        store: {
          getters: {
            'whitelabel/isWhitelabel': () => false,
            'invitation/hasInvitation': () => true,
            'invitation/code': () => '123aeb456',
          },
          actions: {
            'auth/login': jest.fn(() => Promise.resolve()),
            'surveys/fetchPinned': jest.fn(),
          },
        },
        mocks: {
          $route: {
            params: { redirect: false },
            query: {},
          },
          $router: {
            push,
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      await switchLoginMethod();

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      // wait for Promise for pending result
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(push).toHaveBeenCalledWith({ name: 'invitations', query: { code: '123aeb456' } });
    });
  });
});
