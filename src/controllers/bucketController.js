import fs from 'fs';

import boom from '@hapi/boom';

const create = async (req, res) => {
  const { entities, id, subfolder } = req.params;

  if (!req.files || !req.files.media) {
    throw boom.badRequest('No media files posted');
  }

  let files = [];
  if (Array.isArray(req.files.media)) {
    files = req.files.media;
  } else {
    files[0] = req.files.media;
  }

  for (let i = 0; i < files.length; i++) {
    const currentFile = files[i];
    try {
      const folder = `${process.env.BUCKET}/${entities}/${id}/${subfolder}`;
      // TODO: sanity check folder
      fs.mkdirSync(folder, { recursive: true });
      await currentFile.mv(`${folder}/${currentFile.name}`);
    } catch (err) {
      console.log(err);
      throw boom.internal('Ouch :/');
    }
  }

  return res.send(files.map(file => file.name));
};

export default {
  create,
};
