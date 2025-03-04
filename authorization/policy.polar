global{
  roles = ["hr"];
}

actor User{}

resource Team{
  roles = ["member"];
}

resource Folder{
  roles = ["viewer"];
  permissions = ["view"];
  relations = { team: Team };

  "viewer" if "member" on "team";
  "viewer" if global "hr";

  "view" if "viewer";
}

resource Document{
  roles = ["viewer"];
  permissions = ["view"];
  relations = { folder: Folder };

  "viewer" if "viewer" on "folder";
  "view" if "viewer";
}

resource Block{
  roles = ["viewer"];
  permissions = ["view"];
  relations = { document: Document };

  "viewer" if "viewer" on "document";
  "view" if "viewer";
}

test "Polar testing and iteration" {
  setup {
    has_role(User{"alice"}, "hr");
    has_role(User{"alice"}, "member", Team{"hr"});
    has_role(User{"bob"}, "member", Team{"engineering"});

    has_relation(Folder{"hr"}, "team", Team{"hr"});
    has_relation(Folder{"engineering"}, "team", Team{"engineering"});

    has_relation(Document{"bob-private"}, "folder", Folder{"hr"});
    has_relation(Document{"bob-public"}, "folder", Folder{"engineering"});

    has_relation(Block{"block1"}, "document", Document{"bob-private"});
    has_relation(Block{"block2"}, "document", Document{"bob-public"});
  }

  assert allow(User{"alice"}, "view", Block{"block1"});
  assert allow(User{"alice"}, "view", Block{"block2"});

  assert_not allow(User{"bob"}, "view", Block{"block1"});
  assert allow(User{"bob"}, "view", Block{"block2"});
}