import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import Login from './Login.vue';
import mockAxios from 'axios';
import { autoSelectActiveGroup } from '@/utils/memberships';

jest.mock('@/utils/memberships');

beforeEach(() => localStorage.clear());

const renderLogin = ({ props, params, query, getters, $router, dispatchMock } = {}) =>
  renderWithVuetify(Login, {
    props: { ...props },
    global: {
      mocks: {
        $store: {
          getters: { ...getters },
          dispatch: dispatchMock ?? jest.fn(),
        },
        $route: {
          params: { ...params },
          query: { ...query },
        },
        $router: { ...$router },
      },
    },
  });

// run the test with defaultUsePassword=false and =true
const testBothSides = (description, settings, test, beforeBoth = () => {}) => {
  describe('with magic link', () => {
    beforeEach(beforeBoth);
    const linkSettings = { ...settings, props: { ...settings.props, defaultUsePassword: false } };
    it(description, async () => await test(renderLogin(linkSettings), false));
  });
  describe('with user/password', () => {
    beforeEach(beforeBoth);
    const pwSettings = { ...settings, props: { ...settings.props, defaultUsePassword: true } };
    it(description, async () => await test(renderLogin(pwSettings), true));
  });
};

describe('Login component', () => {
  describe('navigation links and buttons', () => {
    testBothSides('Renders link to Register by default', { props: { useLink: true } }, async () => {
      screen.getByRole('link', { name: /Register now/i });
    });

    [true, false].map((invitationOnly) =>
      testBothSides(
        `${
          invitationOnly ? "Don't" : 'Do'
        } render the Register section when the whitelabel is "invitationOnly: ${invitationOnly}"`,
        {
          props: { useLink: true },
          getters: {
            'whitelabel/isWhitelabel': true,
            'whitelabel/partner': {
              id: 1,
            },
          },
        },
        async () => {
          if (invitationOnly) {
            expect(screen.queryByRole('link', { name: /Register now/i })).not.toBeInTheDocument();
            expect(screen.queryByTestId('separator')).not.toBeInTheDocument();
          } else {
            waitFor(() => screen.getByRole('link', { name: /Register now/i }));
            waitFor(() => screen.getByTestId('separator'));
          }
        },
        () => {
          let res = { data: { meta: { invitationOnly } } };
          mockAxios.get.mockImplementation(() => Promise.resolve(res));
          mockAxios.post.mockImplementation(() => Promise.resolve());
        }
      )
    );

    testBothSides(
      'Renders button to Register when useLink is false',
      { props: { useLink: false } },
      async ({ getByRole }) => {
        getByRole('button', { name: /Register now/i });
      }
    );

    describe('with user/password', () => {
      it('Renders link to Forgot Password by default', async () => {
        const { getByRole } = renderLogin({ props: { defaultUsePassword: true } });
        getByRole('link', { name: 'Forgot password?' });
      });

      it('Renders button to Forgot Password when useLink is false', async () => {
        const { getByRole } = renderLogin({ props: { defaultUsePassword: true, useLink: false } });
        getByRole('button', { name: 'Forgot password?' });
      });
    });
  });

  describe('submit form and check user fields', () => {
    describe('with magic link', () => {
      it('shows an error when email is empty', async () => {
        renderLogin({
          props: { defaultUsePassword: false },
        });
        expect(screen.queryByText('E-Mail must not be empty.')).toBeNull();
        await fireEvent.click(screen.getByText(/Send link/i));
        screen.getByText('E-Mail must not be empty.');
      });

      it('sends magic link', async () => {
        const landingPath = '/in/the/app';
        const dispatchMock = jest.fn();
        renderLogin({
          props: { defaultUsePassword: false },
          query: { landingPath },
          dispatchMock,
        });
        const emailInput = screen.getByLabelText('E-Mail');
        const email = 'foo.bar.baz';
        fireEvent.update(emailInput, email);
        await fireEvent.click(screen.getByText(/Send link/i));
        expect(dispatchMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ email, landingPath }));
      });

      it('shows "completed" screen', async () => {
        const landingPath = '/in/the/app';
        renderLogin({
          props: { defaultUsePassword: false },
          query: { landingPath },
        });
        const emailInput = screen.getByLabelText('E-Mail');
        const email = 'foo.bar.baz';
        fireEvent.update(emailInput, email);
        await fireEvent.click(screen.getByText(/Send link/i));
        waitFor(() => screen.getByText(/Magic link sent!/i));
        waitFor(() => screen.getByText(email));
      });

      it('displays server error', async () => {
        const errorText = 'some error from the server';
        const dispatchMock = jest.fn(() => {
          throw { response: { data: { message: errorText } } };
        });
        renderLogin({
          props: { defaultUsePassword: false },
          dispatchMock,
        });
        const emailInput = screen.getByLabelText('E-Mail');
        const email = 'foo.bar.baz';
        fireEvent.update(emailInput, email);
        await fireEvent.click(screen.getByText(/Send link/i));
        expect(dispatchMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ email }));
        await waitFor(() => screen.getByText(errorText));
      });
    });

    describe('with user/password', () => {
      it('shows an error when email is passed without password', async () => {
        const { getByLabelText, getByText, queryByText } = renderLogin({
          props: { defaultUsePassword: true },
        });
        const emailInput = getByLabelText('E-Mail');
        fireEvent.update(emailInput, 'email.error@error.com');
        expect(emailInput.value).toBe('email.error@error.com');
        expect(queryByText('Password must not be empty.')).toBeNull();
        const button = getByText('Login');
        await fireEvent.click(button);
        getByText('Password must not be empty.');
      });

      it('shows an error when password is passed without email', async () => {
        const { getByLabelText, getByText, queryByText } = renderLogin({
          props: { defaultUsePassword: true },
        });
        const passwordInput = getByLabelText('Password');
        fireEvent.update(passwordInput, 'somePassword');
        expect(passwordInput.value).toBe('somePassword');
        expect(queryByText('E-Mail must not be empty.')).toBeNull();
        const button = getByText('Login');
        await fireEvent.click(button);
        getByText('E-Mail must not be empty.');
      });

      it('displays an error when incorrect password is submitted (status 401)', async () => {
        const dispatchMock = (action) => {
          if (action === 'auth/login') {
            return Promise.reject({
              message: 'Invalid email or password',
              response: { status: 401 },
            });
          }
        };
        const { getByLabelText, getByText, findByText } = renderLogin({
          dispatchMock,
          props: { defaultUsePassword: true },
        });
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
        const dispatchMock = (action) => {
          if (action === 'auth/login') {
            return Promise.reject({
              message: 'Invalid email or password',
              response: { status: 404 },
            });
          }
        };
        const { getByLabelText, getByText, findByText } = renderLogin({
          dispatchMock,
          props: { defaultUsePassword: true },
        });
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

      it('displays an error when an error occurred on the login, that is different to 401 and 404 (ex: status 500)', async () => {
        const dispatchMock = (action) => {
          if (action === 'auth/login') {
            return Promise.reject({
              message: 'An error occurred',
              response: { status: 500 },
            });
          }
        };
        const { getByLabelText, getByText, findByText } = renderLogin({
          dispatchMock,
          props: { defaultUsePassword: true },
        });
        const emailInput = getByLabelText('E-Mail');
        fireEvent.update(emailInput, 'email@mail.com');
        expect(emailInput.value).toBe('email@mail.com');

        const pwdInput = getByLabelText('Password');
        fireEvent.update(pwdInput, 'password');
        expect(pwdInput.value).toBe('password');

        const button = getByText('Login');
        await fireEvent.click(button);
        await findByText('An error occurred');
      });
    });
  });

  describe('submit form and check submit() method behaviour based on try to auto join group if this is a whitelabel', () => {
    it('submit and trying autojoin if this.isWhitelabel && this.registrationEnabled', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() => Promise.resolve());
      const push = jest.fn();
      const dispatchMock = jest.fn((action) => {
        if (action === 'auth/login') {
          return jest.fn(() => Promise.resolve());
        }
      });
      const { getByLabelText, getByText } = renderLogin({
        props: { defaultUsePassword: true },
        getters: {
          'whitelabel/isWhitelabel': true,
          'whitelabel/partner': {
            id: 1,
          },
        },
        dispatchMock,
        query: { redirect: false },
        $router: {
          push,
        },
      });

      const email = 'someValidMail@mail.com';
      const password = 'aPassword';

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, email);

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, password);

      const button = getByText('Login');
      await fireEvent.click(button);
      expect(dispatchMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ url: '/auth/login', user: { email: email.toLowerCase(), password } })
      );
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
      const dispatchMock = jest.fn();
      const push = jest.fn();
      const { getByLabelText, getByText } = renderLogin({
        getters: {
          'whitelabel/isWhitelabel': true,
          'whitelabel/partner': {
            id: 1,
          },
        },
        dispatchMock,
        props: { defaultUsePassword: true },
        $router: {
          push,
        },
        query: { redirect: false },
      });
      const email = 'someValidMail@mail.com';
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, email);

      const password = 'aPassword';
      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, password);

      const button = getByText('Login');
      await fireEvent.click(button);
      await waitFor(() =>
        expect(dispatchMock).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ url: '/auth/login', user: { email: email.toLowerCase(), password } })
        )
      );
      await waitFor(() => expect(autoSelectActiveGroup).toHaveBeenCalledTimes(0));
      await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
    });

    it('submit and trying autojoin if this.isWhitelabel === false', async () => {
      const push = jest.fn();
      const login = jest.fn(() => Promise.resolve());
      const dispatchMock = jest.fn((action) => {
        if (action === 'auth/login') {
          return Promise.resolve();
        }
      });
      const { getByLabelText, getByText } = renderLogin({
        props: { defaultUsePassword: true },
        getters: {
          'whitelabel/isWhitelabel': false,
        },
        actions: {
          'auth/login': login,
          'surveys/fetchPinned': jest.fn(),
        },
        dispatchMock,
        query: { redirect: false },
        $router: {
          push,
        },
      });

      const email = 'someValidMail@mail.com';
      const password = 'aPassword';

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, email);

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, password);

      const button = getByText('Login');
      await fireEvent.click(button);
      expect(dispatchMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ url: '/auth/login', user: { email: email.toLowerCase(), password } })
      );
      expect(push).toHaveBeenCalledWith('/');
    });
  });

  describe('submit form and check submit() method behaviour based on redirection', () => {
    it("submit and get the redirection '/'", async () => {
      const push = jest.fn();
      const { getByLabelText, getByText } = renderLogin({
        props: { defaultUsePassword: true },
        getters: {
          'whitelabel/isWhitelabel': false,
        },
        query: { redirect: false },
        $router: {
          push,
        },
      });

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);

      expect(push).toHaveBeenCalledWith('/');
    });

    it("submit and get the redirection 'this.$route.query.redirect = true' ", async () => {
      const push = jest.fn();
      const { getByLabelText, getByText } = renderLogin({
        getters: {
          'whitelabel/isWhitelabel': false,
        },
        query: { redirect: true },
        props: { defaultUsePassword: true },
        $router: {
          push,
        },
      });

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);

      expect(push).toHaveBeenCalledWith(true);
    });
  });
});
