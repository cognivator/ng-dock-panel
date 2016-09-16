#ng-dock-panel

Angular module for dockable panels

_Forked from dardino/ngDock in order to add ng-show/hide and collapsible panel support._

##Usage:

###`dock-panel` and `dock`


```html
<body>
  <div dock-panel>
    <div dock="$angularexpr">my content</div>
  </div>
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
<body>
  <div dock-panel>
    <div dock="fill">my content</div>
  </div>
</body>
```

or:

```html
<body>
  <div dock-panel>
    <div dock="myScopeVariable">my content</div>
  </div>
</body>
```


###`dock-resizable`

If you want to be able to resize a dock you need to set the `dock-resizable` directive:

```html
<body>
  <div dock-panel>
    <div dock="top" dock-resizable>Top</div>
    <div dock="fill">Fill</div>
  </div>
</body>
```

You can also pass an options object that will be passed through to the underlying jquery-ui resizable plugin:

```html
<body>
  <div dock-panel>
    <div dock="top" dock-resizable="{maxHeight: 300}">Top</div>
    <div dock="fill">Fill</div>
  </div>
</body>
```

See [jquery-ui resizable](http://api.jqueryui.com/resizable/) docs for possible options.

If you want to customize the resize handles, you can include an HTML element as a child of the `dock-resizable` element, with a css class of 'dock-resize-handle.' The `dock-resizable` directive will locate the child element and convert it to a resize handle.

```html
<body>
  <div dock-panel>
    <div dock="bottom" dock-resizable>Top
      <div dock-resize-handle></div>
    </div>
  </div>
</body>
```

>notice:
>you can only resize a non 'fill' dock

##Styling

Because ng-dock-panel components are composed of normal HTML elements, you can style them as necessary using a combination of the jquery-ui classes, ng-dock-panel classes and elements, plus your custom classes.
