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
Format: `${origin}/api/auth/enter-with-magic-link?code=${code}&landingPath=${optional}&callbackUrl=${optional}`

DB record: `users.accesscodes { code: 'random 32bytes in hex', expiresAt: Date, email }`
 - A Mongo TTL index is set up to remove the record after the expiresAt date

#### Requesting a magic link:
Sending a request to `POST <surveystack>/auth/request-magic-link` will send a email with the new magic link to the user.
Parameters:
 - `email`: the email of the new or existing user
 - `landingPath`: (optional) the inside-app-path the client should navigate to after accepting the magic link. ie `/surveys/123`
 - `callbackUrl`: (optional) the URL the server should redirect the user to after validating the magic link. Ie. `https://coffeeshop.io?accept-magic-link`
 - `expiresAfterDays` (optional, default=1) number of days after the unused magic link expires


#### Steps of accepting magic links:
 - the server 
    - accepts the request at `/auth/enter-with-magic-link`
   - finds the matching access-code in the DB
   - finds the matching user by the email field of the access code
   - creates the user if it doesn't exist
   - redirects the user to the client to `/auth/accept-magic-link` or to the [`callbackUrl` if it is set](#requesting-a-magic-link)
 - the client 
     - updates the auth state
     - redirects to the landingPath (if set)
     - make a request to the [`invalidateMagicLink`](#client-callback-parameters)
 - the server
     - removes the magic link from the DB

#### Client callback parameters:
If the magic link is valid, the server redirects to `/auth/accept-magic-link` or `callbackUrl` if it's set. It sets these query parameters the client should use to finish the authentication process:
 - `user`: base64 encoded login payload
   - This is the same object SurveyStack returns after the successful email/password login (see `createLoginPayload` function  in `auth.service.js`)
   - contains `'email', 'name', 'token', '_id', 'permissions'`
   - For decoding, it is recommended to use the `decode` function form the `js-base64` package to avoid possible encoding incompabilities
 - `landingPath`: inside-app-path the client should navigate to after accepting the loginPayload
 - `invalidateMagicLink` a URL the client should call after the authentication. This allows us to only invalidate the magic links if they were properly handled by the client. (Ie. when the email provider calls the magic link for security tests, it won't be invalidated)

 #### Handling expired magic links
When the server receives an expired magic link, it will redirect the user to `/auth/login?magicLinkExpired`. There the user can request a new magic link with the SurveyStack client. The new magic link will have the same `landingPath` and `callbackUrl`.


 Notes:
  - Call-for-submission and password-reset links are also magic links. They are using the `landingPath` parameter to navigate the user to the right place in the app after authentication.

## Authentication with invite link
Invitations work similarly to magic links: accepting it will create an account if necessary and authenticate the user.

Format: `${origin}/invitations?code=${membership.meta.invitationCode}`  
DB Record: `memberships { user, group, role, meta: { invitationCode, ... }}`