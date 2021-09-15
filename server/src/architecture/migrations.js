// migrate memberships

// meta.sentTo => meta.inviationEmail
db.memberships.updateMany({}, { $rename: { 'meta.sentTo': 'meta.invitationEmail' } });
// meta.dateClaimed => meta.dateActivated
db.memberships.updateMany({}, { $rename: { 'meta.dateClaimed': 'meta.dateActivated' } });
// meta.invitation => meta.invitationCode
db.memberships.updateMany({}, { $rename: { 'meta.invitation': 'meta.invitationCode' } });
// create meta.dateSent
db.memberships.updateMany({}, { $set: { 'meta.dateSent': null } });
