# Authentication

Auth flow visualization: https://miro.com/app/board/o9J_l5J_iMs=/?moveToWidget=3458764515413760664&cot=14

## Request authorization

The current authentication method is to send an `Authorization` header with each request of the following form:

```
Authorization: $email $token
```

e.g.

```
Authorization: admin@our-sci.net cc90da88-274a-4639-bea1-ff6000274ea0
```

## Authentication with email/password

### Register 
To register a user, make a `POST` request to `/api/auth/register` with the following body:

```
{
    email,
    name,
    password
}
```

e.g.

```
{
    email: 'user@our-sci.net',
    name: 'Jonny Special',
    password: 'FKLXQPKALXA!2231'
}
```

You will get back a user object including `email` and `token`.

### Login

To retrieve the user object later on, make a `POST` request to `/api/auth/login` with the following body:

```
{
    email,
    password
}
```

e.g.

```
{
    email: 'user@our-sci.net',
    password: 'FKLXQPKALXA!2231'
}
```

You will get back a user object including `email` and `token`.

Note: The [frontend webapp](https://gitlab.com/our-sci/our-sci-pwa) makes use of this when logging in. Furthermore, when logging in trough the website, the http client axios from [api.service.js](https://gitlab.com/our-sci/our-sci-pwa/blob/master/src/services/api.service.js) will have its `Authorization` header set accordingly.


## Authentication with magic link
With this method the servers sends a one-time login link (magic link) to the user's email address. 

### Magic link
Format: `${origin}/api/auth/enter-with-magic-link?code=${code}?landingPath=${optional}`

DB record: `users.accesscodes { code: 'random 32bytes in hex', expiresAt: Date, email }`
 - A Mongo TTL index is set up to remove the record after the expiresAt date

Accepting magic links:
 - the server accepts the request at `/auth/enter-with-magic-link`
 - finds the matching access-code in the DB (and removes it)
 - finds the matching user by the email field of the access code
 - creates the user if it doesn't exist
 - redirects the user to  the client at /auth/accept-magic-link
 - the client updates the auth state and redirects to the landingPath (if set)

 Notes:
  - Call-for-submission and password-reset links are also magic links. They are using the `landingPath` parameter to navigate the user to the right place in the app after authentication.

## Authentication with invite link
Invitations work similarly to magic links: accepting it will create an account if necessary and authenticate the user.

Format: `${origin}/invitations?code=${membership.meta.invitationCode}`  
DB Record: `memberships { user, group, role, meta: { invitationCode, ... }}`