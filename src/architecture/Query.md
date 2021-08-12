# Example Queries

## Mongo Shell

```javascript
db.submissions.find({ 'data.favorite_color.value': 'blue' }).pretty();

db.submissions.find({ 'data.personal_group.full_name.value': { $regex: 'olf$' } }).pretty();
```

## Query

From submissions page:

```javascript
{}

//Find
{"data.personal_group.full_name.value": {"$regex": "olf$"}}

//Sort
{"data.personal_group.age.value": -1}

//Projection
{"data.personal_group.full_name": 0}
```

## MongoDB Compass

```javascript
{
  _id: ObjectId('5e303982ea0cf40001aef63c');
}
```
