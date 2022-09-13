import { handleDelegates } from './headerHandlers';
import { createGroup, createReq, createRes } from '../testUtils';
import { cloneDeep } from 'lodash';

describe('handleDelegates', () => {
  it('rethrows errors from passed fn', async () => {
    const t = async (req, res, next) => {
      throw new Error();
    };

    await expect(await handleDelegates(t)).rejects.toThrow(Error);
  });

  it('calls fn with res.locals.auth.user._id set to res.locals.auth.delegateToUserId and res.locals.auth.delegateByUserId set to res.locals.auth.user._id', async () => {
    const group = await createGroup();
    const callingUser = (await group.createAdminMember()).user;
    const delegateToUser = (await group.createUserMember()).user;

    const t = async (req, res, next) => {
      expect(res.locals.auth.user._id.toString()).toStrictEqual(delegateToUser._id.toString());
      expect(res.locals.auth.delegateToUserId.toString()).toStrictEqual(
        delegateToUser._id.toString()
      );
      expect(res.locals.auth.delegateByUserId.toString()).toStrictEqual(callingUser._id.toString());
    };
    let res = await createRes({ user: cloneDeep(callingUser) });
    res.locals.auth.delegateToUserId = delegateToUser._id.toString();
    await handleDelegates(t)(createReq(), res);
  });

  it.todo(
    'throws error if delegateToUserId is passed but calling user is not authorized to delegate to this user'
  );
});
