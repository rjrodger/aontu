# The aontu guide

Tips for writing models, collected from models that exist. This is not
the language reference — [`docs/reference-language.md`](docs/reference-language.md)
says what every form means — and it is not a style guide for prose,
which is [`docs/STYLE-GUIDE.md`](docs/STYLE-GUIDE.md). It is the
smaller, more useful thing: what experience says to reach for, and what
it says to avoid.

Each entry states the tip, then why, then the mechanics you need to act
on it. Every snippet here was run.

## Avoid arrays unless you really need an ordering

**Use a named map.** An array gives every element a number nobody chose,
and a number is a poor name for a thing that has one.

```aon
service: {
  auth: { port: 8001 }
  billing: { port: 8002 }
}
port: $.service.auth.port
```

```json
{"port": 8001,
 "service": {"auth": {"port": 8001}, "billing": {"port": 8002}}}
```

Four things follow from the key, and all four are lost the moment you
write `service: [...]` instead:

- **It is an address.** `$.service.auth.port` says what it reaches.
  `$.service.0.port` says where it happens to sit, which is a different
  and much weaker claim — and one that stops being true when somebody
  inserts a service above it.
- **It is a name other parts of the model can use.** A `parent: "auth"`
  somewhere else in the document names a key that exists. `parent: 0`
  names nothing you can check.
- **Adding one is an insertion, not a renumbering.** A third service goes
  in wherever it reads best. In an array it either goes last, or it
  moves every index after it — including the ones written down in
  another file.
- **The diff is the change.** Insert into the middle of an array and a
  review shows every following element as modified. Insert into a map
  and the review shows one addition.

### The mechanics

A map is walked in **sorted-key order**. A list is walked in **source
order**. That is the whole of the difference, and it is what the choice
turns on:

```aon
step: {
  deploy: { run: "bin/deploy" }
  build: { run: "make" }
  test: { run: "make test" }
}
order: [$.step.build $.step.test $.step.deploy]
by_key: form($.step, _ & { at: key() })
by_order: form($.order, _ & { at: key() })
```

`by_key` comes out `make`, `bin/deploy`, `make test` — build, deploy,
test, alphabetically. `by_order` comes out `make`, `make test`,
`bin/deploy`, which is what the list says.

Two more facts worth knowing before you convert anything:

- **`form` over a map produces a list**, and `key()` inside its template
  is the element's POSITION in that list, not the map key. `form` exists
  precisely to keep an order, so it hands you an ordinal.
- **`pack` over a map produces a map**, and there `key()` IS the key. It
  is how you put a name inside the node that carries it:
  `pack($.service, _ & { id:key() })` gives each service an `id` equal to
  its own key.

That second one matters more than it looks. A dispatch — `emit`,
`filter`, `match` — chooses a rule by what the NODE holds, and a node
does not hold its own key. If a generator needs the name to write a
filename or a class, the name has to be *in* the node: either stated
there, or put there by `pack`.

### When you do need the order, say so

Some orders are facts. Migrations run in one. A pipeline's steps run in
one. A rule table is tried in one, and the first match wins.

Do not smuggle those in as the order somebody happened to type things.
Keep the map, and state the order beside it as a list of references:

```aon
entity: {
  planet: { table: "planets" }
  moon: { table: "moons" parent: "planet" }
}
sequence: [$.entity.planet $.entity.moon]
```

Now the two claims are separate and both are visible. The map says what
exists and what it is called. The list says what depends on what, in one
place, where a reviewer can argue with it. A generator that cares reads
`$.sequence`; one that does not reads `$.entity` and is spared a
decision it never needed to make.

### The worked example

[`test/system/rb-solar`](test/system/rb-solar) is a Rails application
generated from one model, and its entities are a map for exactly these
reasons. Its `sequence` exists because a moon keys into a planet: the
migrations must create `planets` first, and the seeds must insert a
planet before the moon that belongs to it. Five of its nine generators
write one file per entity, never see an order, and read the map.

The pinned tree in
[`doc/model-tree.txt`](test/system/rb-solar/doc/model-tree.txt) is the
argument in miniature. It used to read:

```
├── entity
│   ├── 0 (21)
│   └── 1 (27)
```

and now reads:

```
├── entity
│   ├── moon (27)
│   └── planet (21)
```

The second one tells you what the model contains.
