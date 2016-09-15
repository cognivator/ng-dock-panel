ngDock
======

angular module for tag dock system

Forked from dardino/ngDock in order to add ng-show/hide support.

usage:
------

```html
<body dock-ref>
  <div dock="$angularexpr">my content</div>
</body>
```

$angularexpr is an angular expression that returns one of this:

- top
- left
- right
- bottom
- fill

example:
```html
<body dock-ref>
  <div dock="'fill'"></div>
</body>
```

or:

```html
<body dock-ref>
  <div dock="myScopeVariable">my content</div>
</body>
```

if you want to be able to resize a dock you need to set another directive:

dock-resizable

example:

```html
<body dock-ref>
  <div dock="'top'" dock-resizable>Top</div>
  <div dock="'fill'">Fill</div>
</body>
```

>notice:
>you can only resize a non 'fill' dock

More info: [Wiki](https://github.com/dardino/ngDock/wiki)
