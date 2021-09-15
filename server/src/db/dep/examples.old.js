/*

  Redact Stage:
  If meta.permissions exists, concat its items with ROOT.meta.path, and compare with user permissions
  E.g.
  ROOT.meta.path: '/oursci/lab'
  meta.permissions: ['admin', 'owner']
  => ['admin@/oursci/lab', 'owner@/oursci/lab', ...] has permission
  

  If meta.permissions does not exist, treat its permissions as 'public'.
  => ['public', ...] has permission

*/
const currentStage2 = {
  $cond: {
    if: {
      $gt: [
        {
          $size: {
            $setIntersection: [
              {
                $concatArrays: [
                  {
                    $map: {
                      input: {
                        $ifNull: ['$meta.permissions', []],
                      },
                      as: 'role',
                      in: { $concat: ['$$role', '@', '$$ROOT.meta.path'] },
                    },
                  },
                  {
                    $cond: {
                      if: { $eq: [{ $size: { $ifNull: ['$meta.permissions', []] } }, 0] },
                      then: ['public'],
                      else: [],
                    },
                  },
                ],
              },
              ['public@/oursci/lab', 'public', 'admin@/oursci/lab'], // user permissions
            ],
          },
        },
        0,
      ],
    },
    then: '$$DESCEND',
    else: '$$PRUNE',
  },
};
