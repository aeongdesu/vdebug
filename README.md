# vd(d)ebug
includes [redstonekasi's module dumper](https://gist.github.com/redstonekasi/2447f7657d8f2bb253eed4c482073e37) (stole)

of course, **do not share dumped files with others.**

# explode

```diff
diff --git a/index.js b/index.js
index 61e07a1..ded6c98 100644
--- a/index.js
+++ b/index.js
@@ -81,7 +81,7 @@ wss.on("connection", (ws) => {
           cb();
         } else {
           isPrompting = false;
-          ws.send(input);
+          ws.send(`const res=(0, eval)(${JSON.stringify(input)});console.log(res);res`);
           finishCallback = cb;
         }
       } catch (e) {
```