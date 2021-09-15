import rolesService from '../services/roles.service';

const getRoles = async (req, res) => {
  const roles = await rolesService.getRoles(req.query.userId);
  return res.send(roles);
};

export default {
  getRoles,
};
