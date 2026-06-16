# Notice about the RSL font

This project is an educational parser/analyzer for the writing system known as **Шрифт РЖЯ**.

The font file itself is **not redistributed** in this repository. The web interface references the upstream font remotely in `src/styles.css`:

```css
@font-face {
  font-family: "RSLFontRemote";
  src: local("RSL Font"),
       url("https://cdn.jsdelivr.net/gh/AjnoEO/rslfont@master/RSL_font/symbol_font_for_rsl/rsl-font.ttf") format("truetype");
}
```

Upstream project:

- https://github.com/AjnoEO/rslfont
- https://github.com/AjnoEO/rslfont/tree/master/RSL_font/symbol_font_for_rsl

The upstream `readme.txt` says the font was created by “Ajno” using Fontstruct and cloned from “Symbol Font For ASL”, which is licensed under Creative Commons Attribution 3.0. The upstream archive also contains its own `license.txt` and requires that redistributed font files be accompanied by the archive's other files.

Because this repository does not include the font file, users who want offline font support should download the font and license files directly from the upstream project and keep the licensing notice together with the font.
