# Authenitcation

The current authentication method is to send an `Authorization` header with each request of the following form:

```
Authorization: $email $token
```

e.g.

```
Authorization: admin@our-sci.net cc90da88-274a-4639-bea1-ff6000274ea0
```

## Registration

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

## Login

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
