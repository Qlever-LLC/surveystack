//For groups, we may want to use the following structure
//https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-materialized-paths/

// unique indexes: https://docs.mongodb.com/manual/core/index-unique/
const groups = [
  {
    name: "our-sci",
    path: "/our-sci",
    label: "Our-Sci Organization"
  },
  {
    name: "lab",
    path: "/our-sci/lab",
    label: "Our-Sci Lab Group"
  },
  {
    name: "uw",
    path: "/uw",
    label: "University of Washington"
  },
  {
    name: "biology",
    path: "/uw/biology",
    label: "UW Biology Department"
  },
  {
    name: "undergrad",
    path: "/uw/biology/undergrad",
    label: "Undergrad Group"
  },
  {
    name: "postgrad",
    path: "/uw/biology/postgrad",
    label: "Postgrad Group"
  }
];
