import { handleDelegates } from './headerHandlers';
import { createGroup, createReq, createRes } from '../testUtils';
import { cloneDeep } from 'lodash';

describe('handleDelegates', () => {
  it('rethrows errors from passed fn', async () => {
    const t = async (_req, _res, _next) => {
      throw new Error();
    };

    await expect(await handleDelegates(t)).rejects.toThrow(Error);
  });

  it('calls fn with res.locals.auth.user._id set to res.locals.auth.delegateToUserId and res.locals.auth.proxyUserId set to res.locals.auth.user._id', async () => {
    const group = await createGroup();
    const proxyUser = (await group.createAdminMember()).user;
    const delegateToUser = (await group.createUserMember()).user;

    const t = async (_req, res, _next) => {
      expect(res.locals.auth.user._id.toString()).toStrictEqual(delegateToUser._id.toString());
      expect(res.locals.auth.delegateToUserId.toString()).toStrictEqual(
        delegateToUser._id.toString()
      );
      expect(res.locals.auth.proxyUserId.toString()).toStrictEqual(proxyUser._id.toString());
    };
    let res = await createRes({ user: cloneDeep(proxyUser) });
    res.locals.auth.delegateToUserId = delegateToUser._id.toString();
    await handleDelegates(t)(createReq(), res);
  });

  it('throws error if delegateToUserId is passed but calling user is not authorized to delegate to this user', async () => {
    const proxyUserGroup = await createGroup();
    const proxyUser = (await proxyUserGroup.createAdminMember()).user;
    const delegateUserGroup = await createGroup();
    const delegateToUser = (await delegateUserGroup.createUserMember()).user;

    let res = await createRes({ user: cloneDeep(proxyUser) });
    res.locals.auth.delegateToUserId = delegateToUser._id.toString();

    const t = async (_req, _res, _next) => {
      console.log('t called');
    };

    await handleDelegates(t)(createReq(), res).catch((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('not allowed');
    });
  });
});
