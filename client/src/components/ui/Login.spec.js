import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import Login from './Login.vue';
import mockAxios from 'axios';
import { flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createStoreObject } from '@/store';
import { createAppRouter } from '@/router';

beforeEach(() => localStorage.clear());

const renderLogin = ({ props } = {}, store, router) => renderWithVuetify(Login, { props: { ...props } }, store, router);

// run the test with defaultUsePassword=false and =true
const testBothSides = (description, { props, store, router } = {}, test, beforeBoth = () => {}) => {
  describe('with magic link', () => {
    beforeEach(beforeBoth);
    it(
      description,
      async () => await test(renderLogin({ props: { ...props, defaultUsePassword: false } }, store, router), false)
    );
  });
  describe('with user/password', () => {
    beforeEach(beforeBoth);
    it(
      description,
      async () => await test(renderLogin({ props: { ...props, defaultUsePassword: false } }, store, router), true)
    );
  });
};

describe('Login component', () => {
  describe('navigation links and buttons', () => {
    testBothSides('Renders link to Register by default', { props: { useLink: true } }, async () => {
      screen.getByRole('link', { name: /Register now/i });
    });

    [true, false].map((invitationOnly) => {
      const store = createStore(createStoreObject());
      store.dispatch = jest.fn();
      store.getters = {
        'whitelabel/isWhitelabel': true,
        'whitelabel/partner': {
          id: 1,
        },
      };
      testBothSides(
        `${
          invitationOnly ? "Don't" : 'Do'
        } render the Register section when the whitelabel is "invitationOnly: ${invitationOnly}"`,
        {
          props: { useLink: true },
          store,
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
      );
    });

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
        const store = createStore(createStoreObject());
        store.dispatch = dispatchMock;
        renderLogin(
          {
            props: { defaultUsePassword: false, landingPath },
          },
          store
        );
        const emailInput = screen.getByLabelText('E-Mail');
        const email = 'foo.bar.baz';
        fireEvent.update(emailInput, email);
        await fireEvent.click(screen.getByText(/Send link/i));
        expect(dispatchMock).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            email,
            landingPath,
          })
        );
      });

      it('shows "completed" screen', async () => {
        const landingPath = '/in/the/app';
        renderLogin({
          props: { defaultUsePassword: false, landingPath },
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
        const store = createStore(createStoreObject());
        store.dispatch = dispatchMock;
        renderLogin(
          {
            props: { defaultUsePassword: false },
          },
          store
        );
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
        const store = createStore(createStoreObject());
        store.dispatch = dispatchMock;
        const { getByLabelText, getByText, findByText } = renderLogin(
          {
            props: { defaultUsePassword: true },
          },
          store
        );
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
        const store = createStore(createStoreObject());
        store.dispatch = dispatchMock;

        const { getByLabelText, getByText, findByText } = renderLogin(
          {
            props: { defaultUsePassword: true },
          },
          store
        );
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
    const WHITELABEL_GROUP_ID = 42;
    it('submit and trying autojoin if this.isWhitelabel && this.registrationEnabled', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() => Promise.resolve());
      const store = createStore(createStoreObject());
      const dispatchMock = jest.fn((action) => {
        if (action === 'auth/login') {
          return jest.fn(() => Promise.resolve());
        }
        if (action === 'memberships/getUserMemberships') {
          return Promise.resolve([
            {
              group: {
                _id: 1,
              },
            },
          ]);
        }
      });
      store.dispatch = dispatchMock;
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      store.getters = {
        'whitelabel/isWhitelabel': true,
        'whitelabel/partner': {
          id: 1,
        },
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };

      const { getByLabelText, getByText } = renderLogin(
        {
          props: { defaultUsePassword: true },
        },
        store,
        router
      );

      const email = 'someValidMail@mail.com';
      const password = 'aPassword';

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, email);

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, password);

      const button = getByText('Login');
      await fireEvent.click(button);
      await flushPromises();

      expect(dispatchMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          url: '/auth/login',
          user: { email: email.toLowerCase(), password },
        })
      );
      expect(router.push).toHaveBeenCalledWith('/groups/1');
    });

    it('submit if this.isWhitelabel, but autojoin throws an error', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() =>
        Promise.reject({
          response: { data: { message: 'an error message' } },
        })
      );
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      const store = createStore(createStoreObject());
      store.dispatch = jest.fn((action) => {
        if (action === 'memberships/getUserMemberships') {
          return Promise.resolve([]);
        }
      });
      store.getters = {
        'whitelabel/isWhitelabel': true,
        'whitelabel/partner': {
          id: WHITELABEL_GROUP_ID,
        },
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };
      const { getByLabelText, getByText } = renderLogin({ props: { defaultUsePassword: true } }, store, router);
      const email = 'someValidMail@mail.com';
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, email);

      const password = 'aPassword';
      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, password);

      const button = getByText('Login');
      await fireEvent.click(button);
      await flushPromises();

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      //redirect to / to not block the user but allowing him to find his group manually
      expect(router.push).toHaveBeenCalledWith('/');
    });

    it('submit and trying autojoin if this.isWhitelabel === false', async () => {
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      const store = createStore(createStoreObject());
      const dispatchMock = jest.fn((action) => {
        if (action === 'auth/login') {
          return Promise.resolve();
        }
        if (action === 'memberships/getUserMemberships') {
          return Promise.resolve([
            {
              group: {
                _id: 2,
              },
            },
          ]);
        }
      });
      store.dispatch = dispatchMock;
      store.getters = {
        'whitelabel/isWhitelabel': false,
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };

      const { getByLabelText, getByText } = renderLogin(
        {
          props: { defaultUsePassword: true },
        },
        store,
        router
      );

      const email = 'someValidMail@mail.com';
      const password = 'aPassword';

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, email);

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, password);

      const button = getByText('Login');
      await fireEvent.click(button);
      await flushPromises();
      expect(dispatchMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          url: '/auth/login',
          user: { email: email.toLowerCase(), password },
        })
      );
      expect(router.push).toHaveBeenCalledWith('/groups/2');
    });
  });

  describe('submit form and check submit() method behaviour based on redirection', () => {
    const dispatchMock = jest.fn((action) => {
      if (action === 'memberships/getUserMemberships') {
        return Promise.resolve([
          {
            group: {
              _id: 2,
            },
          },
        ]);
      }
    });
    it("submit and get the redirection '/'", async () => {
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      const store = createStore(createStoreObject());
      store.dispatch = dispatchMock;
      store.getters = {
        'whitelabel/isWhitelabel': false,
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };
      const { getByLabelText, getByText } = renderLogin(
        {
          props: { defaultUsePassword: true },
        },
        store,
        router
      );

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      await flushPromises();

      expect(router.push).toHaveBeenCalledWith('/groups/2');
    });

    it("submit and get the redirection 'this.$route.query.redirect = true' ", async () => {
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      const store = createStore(createStoreObject());
      store.dispatch = dispatchMock;
      store.getters = {
        'whitelabel/isWhitelabel': false,
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };
      const { getByLabelText, getByText } = renderLogin(
        {
          props: { defaultUsePassword: true, redirect: '/path' },
        },
        store,
        router
      );

      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'aPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      await flushPromises();

      expect(router.push).toHaveBeenCalledWith('/path');
    });
  });
});
