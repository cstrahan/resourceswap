#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#   "drawsvg",
# ]
# ///

import drawsvg as draw


def generate_interceptor_svg():
    d = draw.Drawing(512, 512, origin="center")

    # Define the core shapes to be drawn
    # (Shape type, attributes, optional path data)

    # The dashed line
    orig_path_style = {
        "stroke_width": 24,
        "stroke_dasharray": "30,25",
        "stroke_linecap": "round",
    }

    # The reroute path (S-curve)
    reroute_d = "M -210,0 L -60,0 C 40,0 20,-180 180,-180"

    # The Arrowhead
    arrow_pts = [170, -215, 230, -180, 170, -145]

    # The Center Diamond
    diamond_pts = [-55, 0, 0, -55, 55, 0, 0, 55]

    # --- 1. Draw the "Halo" (White Outline) ---
    # We draw the main path and arrow slightly thicker in white
    # to create a border that follows the shape outside the circle.

    # Circle outline (outermost)
    d.append(draw.Circle(0, 0, 248, fill="white"))

    # Reroute path outline
    d.append(
        draw.Path(
            d=reroute_d,
            stroke="white",
            stroke_width=58,
            fill="none",
            stroke_linecap="round",
        )
    )

    # Arrowhead outline (using a thick stroke to expand it)
    d.append(
        draw.Lines(
            *arrow_pts,
            close=True,
            fill="white",
            stroke="white",
            stroke_width=16,
            stroke_linejoin="round",
        )
    )

    # --- 2. Draw the Main Icon Components ---

    # Main Blue Circle
    d.append(draw.Circle(0, 0, 240, fill="#1e293b"))

    # Original Intercepted Path
    d.append(draw.Line(-210, 0, 210, 0, stroke="#475569", **orig_path_style))

    # Actual Reroute Path (Orange)
    d.append(
        draw.Path(
            d=reroute_d,
            stroke="#f59e0b",
            stroke_width=42,
            fill="none",
            stroke_linecap="round",
        )
    )

    # Actual Arrowhead (Orange)
    d.append(draw.Lines(*arrow_pts, close=True, fill="#f59e0b"))

    # Center Interceptor Node
    d.append(
        draw.Lines(
            *diamond_pts, close=True, fill="#38bdf8", stroke="#f8fafc", stroke_width=12
        )
    )

    d.save_svg("extension_icon_halo.svg")
    print("✨ Icon generated with full white halo: extension_icon_halo.svg")


if __name__ == "__main__":
    generate_interceptor_svg()
