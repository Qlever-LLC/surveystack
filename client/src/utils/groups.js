import api from '@/services/api.service';
import store from '../store';

export const handleize = (str) => {
  const handle = str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '')
    .replace(/^-/, '');
  return handle;
};

export const getGroupNameById = async (id) => {
  const groups = await store.getters['memberships/groups'];
  const group = groups.find((g) => g._id === id);
  if (group != null) {
    return group.name;
  }
  const response = await api.get(`/groups/${id}`);
  return response.data.name;
};
