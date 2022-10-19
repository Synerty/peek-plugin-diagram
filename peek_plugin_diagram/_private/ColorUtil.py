from colormath.color_conversions import convert_color
from colormath.color_diff import delta_e_cie2000
from colormath.color_objects import sRGBColor
from colormath.color_objects import LabColor
from tinycss2.color3 import RGBA
from tinycss2.color3 import parse_color


def parseCSSColor(color: str) -> RGBA:
    return parse_color(color)


def rgbaToHexA(r: float, g: float, b: float, a: float) -> str:
    return "#{:02x}{:02x}{:02x}{:02x}".format(
        round(255 * r), round(255 * g), round(255 * b), round(255 * a)
    )


def rgbToLab(r: int, g: int, b: int) -> LabColor:
    rgb = sRGBColor(rgb_r=r, rgb_g=g, rgb_b=b)
    return convert_color(rgb, LabColor, target_illuminant="d65")


def labToRgb(lighting, a, b) -> sRGBColor:
    lab = LabColor(lab_l=lighting, lab_a=a, lab_b=b)
    return convert_color(lab, sRGBColor, target_illuminant="d65")


def calculateColorDifference(color1: LabColor, color2: LabColor) -> float:
    return delta_e_cie2000(color1=color1, color2=color2)


def invertColor(cssColor: str, backgroundCssColor: str) -> str:
    cssColor = parseCSSColor(cssColor)
    labColor = rgbToLab(cssColor.red, cssColor.green, cssColor.blue)

    backgroundCssColor = parseCSSColor(backgroundCssColor)
    backgroundLabColor = rgbToLab(
        backgroundCssColor.red,
        backgroundCssColor.green,
        backgroundCssColor.blue,
    )

    invertedLabColor = LabColor(
        lab_l=100 - labColor.lab_l, lab_a=labColor.lab_a, lab_b=labColor.lab_b
    )

    invertedRgb = labToRgb(
        invertedLabColor.lab_l, invertedLabColor.lab_a, invertedLabColor.lab_b
    )

    # return invertedRgb
    return rgbaToHexA(
        invertedRgb.rgb_r,
        invertedRgb.rgb_g,
        invertedRgb.rgb_b,
        cssColor.alpha,  # take alpha from original input color
    )
