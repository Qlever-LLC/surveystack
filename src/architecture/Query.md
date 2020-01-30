# Example Queries

## Mongo Shell

```javascript
db.submissions.find({ data: { $elemMatch: { name: 'favorite_color', value: 'blue' } } }).pretty();
db.submissions
  .find({
    data: {
      $elemMatch: { name: 'personal_group', children: { $elemMatch: { name: 'age', value: '2' } } },
    },
  })
  .pretty();
db.submissions
  .find({
    data: {
      $elemMatch: {
        name: 'personal_group',
        children: { $elemMatch: { name: 'full_name', value: 'Nora Rudolf' } },
      },
    },
  })
  .pretty();
db.submissions
  .find({
    data: {
      $elemMatch: {
        name: 'personal_group',
        children: { $elemMatch: { name: 'full_name', value: { $regex: 'Andreas' } } },
      },
    },
  })
  .pretty();
```

## Query

From submissions page:

```javascript
{}

{"data.value": "blue"}

{"data": { "$elemMatch": {"name": "favorite_color", "value": "blue"}}}

{"data": { "$elemMatch": {"name": "favorite_color", "value": "red"}}, "meta.version": 0}

{"data": {"$elemMatch": { "name": "personal_group", "children": {"$elemMatch": {"name": "full_name", "value": "Andreas Rudolf"}}}}}

{"data": {"$elemMatch": { "name": "personal_group", "children": {"$elemMatch": {"name": "full_name", "value": {"$regex": "Andrea"}}}}}}

```
