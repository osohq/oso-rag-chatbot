export const facts = [
    [ "has_role", {"type": "User", "id": "diane"}, "hr" ],
    [ "has_role", {"type": "User", "id": "diane"}, "member", {"type": "Team", "id": "1"} ],
    [ "has_role", {"type": "User", "id": "bob"}, "member", {"type": "Team", "id": "2"} ],
    [ "has_relation", {"type": "Folder", "id": "1"}, "team", {"type": "Team", "id": "1"} ],
    [ "has_relation", {"type": "Folder", "id": "2"}, "team", {"type": "Team", "id": "2"} ]
]