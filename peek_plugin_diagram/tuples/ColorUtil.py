from colormath import color_diff_matrix
from colormath.color_conversions import convert_color
from colormath.color_diff import _get_lab_color1_vector
from colormath.color_diff import _get_lab_color2_matrix
from colormath.color_objects import sRGBColor
from colormath.color_objects import LabColor
from tinycss2.color3 import RGBA
from tinycss2.color3 import parse_color


def delta_e_cie2000(color1, color2, Kl=1, Kc=1, Kh=1):
    """
    Calculates the Delta E (CIE2000) of two colors.
    """
    color1_vector = _get_lab_color1_vector(color1)
    color2_matrix = _get_lab_color2_matrix(color2)
    delta_e = color_diff_matrix.delta_e_cie2000(
        color1_vector, color2_matrix, Kl=Kl, Kc=Kc, Kh=Kh
    )[0]
    # workaround to `numpy.asscalar()` deprecation
    return float(delta_e)


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


def invertColor(
    cssColor: str,
    backgroundCssColor: str,
    calibrate: bool = True,
    colorShift: float = 0.05,
) -> str:
    cssColor = parseCSSColor(cssColor)
    labColor = rgbToLab(cssColor.red, cssColor.green, cssColor.blue)

    backgroundCssColor = parseCSSColor(backgroundCssColor)
    backgroundLabColor = rgbToLab(
        backgroundCssColor.red,
        backgroundCssColor.green,
        backgroundCssColor.blue,
    )

    invertedLabColor = LabColor(
        lab_l=100 - labColor.lab_l,  # invert the lighting
        lab_a=labColor.lab_a,
        lab_b=labColor.lab_b,
    )

    if (
        calibrate
        and calculateColorDifference(invertedLabColor, backgroundLabColor) < 2.0
    ):
        # when inverted color looks too similar to background color
        lightingShift = max(2, colorShift * invertedLabColor.lab_l)

        newLighting = invertedLabColor.lab_l

        if backgroundLabColor.lab_l > 50:
            # tone the color with bright background
            newLighting -= lightingShift
        else:
            # tint the color with dark background
            newLighting += lightingShift

        # boundary limits
        newLighting = min(newLighting, 100)
        newLighting = max(0, newLighting)

        invertedLabColor = LabColor(
            lab_l=newLighting,
            lab_a=invertedLabColor.lab_a,
            lab_b=invertedLabColor.lab_b,
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
