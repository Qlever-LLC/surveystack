## Routes

### Account Routes

- Invite view: 
	/invites/:invite_id
- Create Invite 
	<!-- /invites/new?groupID=:id -->
	/groups/:id/invites/new
- View Invites
	/groups/:group_id/invites
- Sign up form page: 
	/users/sign-up
- Login page: 
	/users/login
- User Account page: 
	/users/:account_id

### Collect Routes

- Survey Definition Explorer (root): 
	/surveys 
- User's Survey Definition Explorer:
	<!-- /surveys/browse -->
	/my-surveys/browse
- User's Draft/Outgoing/Sent Surveys:
	<!-- /surveys/my-surveys -->
	/my-submissions
	/my-submissions/drafts
	/my-submissions/outgoing
	/my-submissions/sent
- View Survey definition (should have some stats about survey, list of questions, hyperlink to start new survey result for definition, hyperlink to edit in Builder)
	<!-- /surveys/collect/:definition_id -->
	<!-- /surveys/:definition_id/collect -->
	/surveys/:definition_id
	<!-- /surveys/:definition_id/edit -->
- Select a Survey Definition to create a new Result for
	/submissions/new
- View Survey Result Instance overview (can be new, draft, completed/ready for review, or finished/submitted)
	/submissions/:result_id
- Answer Survey Result (fill out questions, continue in survey result)
	/submissions/:result_id/edit



### Builder Routes

- Create a new Survey Definition
	/surveys/new
	<!-- /builder/new -->
- Edit a Survey Definition
	/surveys/:def_id/edit
	/surveys/:def_id/preview
	/surveys/:def_id/preview/collect
	/surveys/:def_id/preview/submissions


### Group Routes

- List all groups / Explore Groups
	/groups
- Show Group under path
	<!-- /groups/:path/to/group/ -->
	/groups/:id
- Create new Group
	/groups/new
	/groups/new?path=:path
- Edit group
	/groups/:id/edit
- Edit group members
	/groups/:id/edit/members
- Group pretty links
	/g/
	/g/:path/to/group


### Dashboard Routes

- Explore dashboards
	/dashboards/explore
- List of user's Dashboards (for group, or pinned by user)
	/my-dashboards/
- Create new Dashboard
	/dashboards/new
- View Dashboard
	/dashboards/:id
- Edit Dashboard
	/dashboards/:id/edit
