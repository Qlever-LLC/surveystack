// yarn client:test -- -- client/src/components/ui/Register.spec.js

import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import Register from './Register.vue';
import { RouterLinkStub } from '@vue/test-utils';

describe('Register component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to Register by default', async () => {
      const { getByRole } = renderWithVuetify(Register, {
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
      getByRole('link', { name: 'Sign in' });
    });
    it('Renders button to Register when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(Register, {
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
      getByRole('button', { name: 'Sign in' });
    });
  });

  describe('submitting form', () => {
    it('shows an error when email is passed without password', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Register, {
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
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');
      expect(queryByText('Password must not be empty.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      getByText('Password must not be empty.');
    });

    it('shows an error when password is passed without email', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Register, {
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
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'somePassword');
      expect(passwordInput.value).toBe('somePassword');
      expect(queryByText('Email must not be empty.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      getByText('Email must not be empty.');
    });

    it('shows an error when email is passed with password and password confirmation who are different', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Register, {
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
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'somePassword');
      expect(passwordInput.value).toBe('somePassword');
      const passwordConfirmationInput = getByLabelText('Password confirmation');
      fireEvent.update(passwordConfirmationInput, 'otherPassword');
      expect(passwordConfirmationInput.value).toBe('otherPassword');

      expect(queryByText('Password must not be empty.')).toBeNull();
      expect(queryByText('E-Mail must not be empty.')).toBeNull();
      expect(queryByText('Passwords do not match.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      getByText('Passwords do not match.');
    });

    it("don't shows an error when email is passed with password and password confirmation who are the same", async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        message: 'Success',
        response: { status: 200 },
      });
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Register, {
        propsData: {},
        store: {
          actions: {
            'auth/login': authLoginMock,
          },
        },
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');
      expect(passwordInput.value).toBe('samePassword');
      const passwordConfirmationInput = getByLabelText('Password confirmation');
      fireEvent.update(passwordConfirmationInput, 'samePassword');
      expect(passwordConfirmationInput.value).toBe('samePassword');

      expect(queryByText('Passwords do not match.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      expect(queryByText('Passwords do not match.')).toBeNull();
    });

    const TransitionStub = {
      render(h) {
        return h('transition-stub', this.$slots.default);
      },
    };

    it('displays an error when status 409', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        response: { status: 409, data: { message: 'error message' } },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        store: {
          actions: {
            'auth/login': authLoginMock,
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
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      expect(emailInput.value).toBe('email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');
      expect(passwordInput.value).toBe('samePassword');
      const passwordConfirmationInput = getByLabelText('Password confirmation');
      fireEvent.update(passwordConfirmationInput, 'samePassword');
      expect(passwordConfirmationInput.value).toBe('samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await findByText('error message');
    });

    it('displays an error when status 400', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        response: { status: 400, data: { message: 'error message' } },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        store: {
          actions: {
            'auth/login': authLoginMock,
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
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      expect(emailInput.value).toBe('email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');
      expect(passwordInput.value).toBe('samePassword');
      const passwordConfirmationInput = getByLabelText('Password confirmation');
      fireEvent.update(passwordConfirmationInput, 'samePassword');
      expect(passwordConfirmationInput.value).toBe('samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await findByText('error message');
    });

    it('displays an error when an error occured and status is different to 409 and 400 (ex: status 500)', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        response: { status: 500, data: { message: 'Unknown error :/' } },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        store: {
          actions: {
            'auth/login': authLoginMock,
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
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      expect(emailInput.value).toBe('email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');
      expect(passwordInput.value).toBe('samePassword');
      const passwordConfirmationInput = getByLabelText('Password confirmation');
      fireEvent.update(passwordConfirmationInput, 'samePassword');
      expect(passwordConfirmationInput.value).toBe('samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await findByText('Unknown error :/');
    });
  });
});
