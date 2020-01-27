/*

Proposed architecture
 Similar to gitlab (with groups)
 There are user and groups, both of which can have resources (surveys, scripts, dashboards)
 The namespace for user and groups is the same.

 User: anrudolf, Resources: survey ch109pgccqwoicbqp
 Survey under: mango.our-sci.net/anrudolf/ch109pgccqwoicbqp

 Group: nexus, survey: cphqcqpicqpicq
 Survey under: mango.our-sci.net/nexus/cphqcqpicqpicq

Maybe it would be better if resources did have an id after all, such as "soil-script-3",
after all there should not be a lot of collisions since everything will reside under the
namespace of a group or a user.



There are multiple components to a survey:
- Survey definition
- Scripts
- Dashboard
- Survey results

Browsing a group's resources could be rather complicated...
How would you display all scripts from group our-sci?
e.g.
/our-sci/scripts
But then scripts looks like a sub-group name...
Maybe this would be a better approach?
/our-sci?type=scripts
Also, should the above include only top-level scripts or all scripts including those
inside sub-groups of our-sci?

Let's assume a survey uses a script from another group.. e.g.
/our-sci/soil-survey-2019
uses a script from 
/university-washington/soil-detector-script-3

Then what happens if university of washington decides to
change, remove or privatize their soil script??
Maybe surveys should be "projects", and every dependency
should be included within the project itself?


Do we really need to push to multiple groups at the same time?
While technically possible, that would make a very complicated/confusing UI..

Ownership:
Until now, it was only possible to have one owner of type user.
The current proposal is that if a survey is transfered to a group, then the group's
owner will be the sole owner of said survey.
In my opinion, this goes a bit against the idea of a community.
Maybe it should be possible for a group to be an owner, or at least have multiple owners.
Maybe compare it with Gitlab's approach, where there are "Owners" of a group,
and when new projects are created under this group, the owners will also own these new projects?



For groups, we may want to use the following structure
https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-materialized-paths/


Gitlab uses predefined roles:
- Guest, Developer, Maintainer, Owner
... should we use pre-defined roles as well? Or allow groups to define their own roles?


Permissions could be like something like this:
permissions: ["admin@our-sci", "member@rfc-lab", "greg"]

*/

const user = {
  _id: '5dc4294f48ddbfa5e0bca38e',
  email: '',
  name: 'greg',
  token: '838b0f85-ca5d-4117-b2bd-7bd5ece53d0b',
  password: '$2b$12$Y3DIwVT2EYiJJZ5E8Wag5O/zDBOMuYYQCWzVaXuJ52vUyXm4SzpmG',
  permissions: ['/u/greg', '/g/our-sci/admins'],
  authProviders: [],
};

const submissions = [
  {
    _id: '5dad943147df8b5519345360',
    data: [
      {
        name: 'hero_name',
        type: 'inputText',
        value: 'Batman',
      },
      {
        name: 'hero_ability',
        type: 'inputText',
        value: 'nokill bash',
        permissions: ['/g/our-sci/admins'],
      },
    ],
    survey: '5dad91cd925e13de6f174644',
    created: '2019-10-21T11:19:13.363Z',
  },
  {
    _id: '5daed44a056ef43d64ed4c35',
    data: [
      {
        name: 'hero_name',
        type: 'inputText',
        value: 'Robin',
      },
      {
        name: 'hero_ability',
        type: 'inputText',
        value: 'side kick',
      },
    ],
    survey: '5dad91cd925e13de6f174644',
    created: '2019-10-22T10:04:58.144Z',
  },
];

// versioning
// https://stackoverflow.com/questions/17770338/comparing-versions-in-mongodb
// version should be a property on bascially any resource
// e.g. version 1.3.9
const survey1 = {
  version: {
    major: 1,
    minor: 3,
    patch: 9,
  },
  otherFields: {},
};
