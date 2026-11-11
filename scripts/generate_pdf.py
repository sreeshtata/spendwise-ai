import os
import sys

def create_styled_pdf(output_path):
    # Professional standard PDF 1.4 generator
    # Page dimensions: A4 is 595.28 x 841.89 points
    # Margins: Left 45, Right 550, Top 800, Bottom 40
    
    commands = []
    
    # Background card behind header banner
    commands.append("q 0.039 0.145 0.251 rg 40 730 515 80 re f Q")
    # Accent emerald strip at top of banner
    commands.append("q 0.063 0.725 0.506 rg 40 806 515 4 re f Q")
    
    # Header Text
    commands.append("BT")
    commands.append("1 1 1 rg") # White text
    commands.append("/F1 22 Tf")
    commands.append("55 772 Td")
    commands.append("(SpendWise AI - Smart Spending Assistant) Tj")
    commands.append("/F2 10.5 Tf")
    commands.append("0 -18 Td")
    commands.append("(Independent PayPal-Connected Hackathon Prototype | Executive Summary) Tj")
    commands.append("ET")
    
    # Helper to draw section box
    def draw_section_box(y_top, height, title):
        cmds = []
        # Box background & border
        cmds.append(f"q 0.97 0.98 0.99 rg 40 {y_top - height} 515 {height} re f Q")
        cmds.append(f"q 0.85 0.88 0.92 RG 1 w 40 {y_top - height} 515 {height} re s Q")
        # Title bar pill
        cmds.append(f"q 0.039 0.145 0.251 rg 40 {y_top - 20} 515 20 re f Q")
        cmds.append("BT")
        cmds.append("1 1 1 rg")
        cmds.append("/F1 11 Tf")
        cmds.append(f"52 {y_top - 14} Td")
        cmds.append(f"({title}) Tj")
        cmds.append("ET")
        return cmds

    # 1. Name & Small Description
    commands.extend(draw_section_box(715, 95, "1. NAME & SMALL DESCRIPTION"))
    commands.append("BT")
    commands.append("0.06 0.09 0.16 rg")
    commands.append("/F1 10 Tf")
    commands.append("52 678 Td")
    commands.append("(Name: ) Tj")
    commands.append("/F2 10 Tf")
    commands.append("35 0 Td")
    commands.append("(SpendWise AI - Smart Spending Assistant) Tj")
    commands.append("/F2 9.5 Tf")
    commands.append("-35 -16 Td")
    commands.append("(Small Description: An independent, PayPal-connected personal financial copilot designed) Tj")
    commands.append("0 -13 Td")
    commands.append("(to empower consumers to make disciplined, highly informed purchasing decisions. It unites) Tj")
    commands.append("0 -13 Td")
    commands.append("(deterministic monthly envelope budgeting with non-negotiable living protections, true delivered) Tj")
    commands.append("0 -13 Td")
    commands.append("(costs, PayPal Sandbox test payments, and privacy-preserving peer spending benchmarks.) Tj")
    commands.append("ET")

    # 2. Problem You Tried to Solve
    commands.extend(draw_section_box(605, 120, "2. PROBLEM YOU TRIED TO SOLVE"))
    commands.append("BT")
    commands.append("0.06 0.09 0.16 rg")
    commands.append("/F2 9.5 Tf")
    commands.append("52 570 Td")
    commands.append("(1. Opaque True Purchase Costs: Sticker prices routinely conceal shipping, handling, and) Tj")
    commands.append("0 -13 Td")
    commands.append("(   mandatory local taxes until final checkout, causing sudden monthly budget overruns.) Tj")
    commands.append("0 -15 Td")
    commands.append("(2. Unrealistic or Destructive Budgeting: Conventional apps either act as passive rear-view) Tj")
    commands.append("0 -13 Td")
    commands.append("(   trackers or recommend naive mathematical cuts that slash non-negotiable essentials (rent/food).) Tj")
    commands.append("0 -15 Td")
    commands.append("(3. Disconnected E-Commerce: Shopping is isolated from budgeting; users cannot immediately) Tj")
    commands.append("0 -13 Td")
    commands.append("(   calculate how an active cart impact remaining category headroom before making payments.) Tj")
    commands.append("0 -15 Td")
    commands.append("(4. Context Vacuum: Inability to benchmark personal spending against verified, privacy-safe cohorts.) Tj")
    commands.append("ET")

    # 3. The Best Solution You Have Come Up With
    commands.extend(draw_section_box(470, 135, "3. THE BEST SOLUTION YOU HAVE COME UP WITH"))
    commands.append("BT")
    commands.append("0.06 0.09 0.16 rg")
    commands.append("/F2 9.5 Tf")
    commands.append("52 435 Td")
    commands.append("(* Smart Budget Plans: Deterministic baseline calculations combined with structured AI optimization) Tj")
    commands.append("0 -13 Td")
    commands.append("(  that safeguards essential commitments (rent, groceries) and explicitly flags infeasible shortfalls.) Tj")
    commands.append("0 -15 Td")
    commands.append("(* Smarter Product Search: Complete delivered cost calculation (item + shipping + tax - discounts)) Tj")
    commands.append("0 -13 Td")
    commands.append("(  paired with real-time remaining budget impact and verified PayPal Sandbox checkout.) Tj")
    commands.append("0 -15 Td")
    commands.append("(* Spending Intelligence: Peer benchmarking enforcing k>=30 privacy threshold, median spending) Tj")
    commands.append("0 -13 Td")
    commands.append("(  analysis, and normalized historical period comparisons (-12.5% expense, +10.0 pp savings rate).) Tj")
    commands.append("0 -15 Td")
    commands.append("(* Integer Minor-Unit Math: 100% integer paise/cents math eliminates IEEE-754 floating-point drift.) Tj")
    commands.append("ET")

    # 4. How You Have Created the Solution (App / Web / AI)
    commands.extend(draw_section_box(320, 135, "4. HOW YOU CREATED THE SOLUTION IN THE FORM OF APP / WEB / AI"))
    commands.append("BT")
    commands.append("0.06 0.09 0.16 rg")
    commands.append("/F2 9.5 Tf")
    commands.append("52 285 Td")
    commands.append("(* Web Application (Frontend): React 18, TypeScript, Vite, Tailwind CSS, Lucide icons.) Tj")
    commands.append("0 -13 Td")
    commands.append("(  Features AG Grid Community for ledger/products, Recharts for budget/peer graphs, TanStack Query.) Tj")
    commands.append("0 -15 Td")
    commands.append("(* Backend API & Engine: Node.js, Express, TypeScript, Zod runtime schema validation.) Tj")
    commands.append("0 -13 Td")
    commands.append("(  Houses single-source-of-truth financial calculator service, CSV injection defense, and REST APIs.) Tj")
    commands.append("0 -15 Td")
    commands.append("(* AI & Rules Engine: Dual-layer intelligence combining deterministic rule validation with) Tj")
    commands.append("0 -13 Td")
    commands.append("(  Gemini generative narrative explanations and structured constraint-tested recommendations.) Tj")
    commands.append("0 -15 Td")
    commands.append("(* Integrations: PayPal Sandbox test payments, Channel3 product search, Elasticsearch with DB fallback.) Tj")
    commands.append("ET")

    # Verification Footer Callout
    commands.append("q 0.94 0.99 0.96 rg 40 120 515 45 re f Q")
    commands.append("q 0.5 0.85 0.65 RG 1 w 40 120 515 45 re s Q")
    commands.append("BT")
    commands.append("0.08 0.45 0.22 rg")
    commands.append("/F1 10 Tf")
    commands.append("52 148 Td")
    commands.append("(VERIFICATION & QUALITY AUDIT STATUS: 100% PASS RATE) Tj")
    commands.append("/F2 9 Tf")
    commands.append("0 -14 Td")
    commands.append("(All 51 automated regression tests passed across financial math, auth isolation, budgets, and PayPal.) Tj")
    commands.append("ET")

    # Page Bottom Footer
    commands.append("BT")
    commands.append("0.45 0.55 0.65 rg")
    commands.append("/F2 8.5 Tf")
    commands.append("145 65 Td")
    commands.append("(SpendWise AI - Smart Spending Assistant - Independent PayPal Prototype - Page 1 of 1) Tj")
    commands.append("ET")

    stream_content = "\n".join(commands).encode("latin1")
    stream_len = len(stream_content)

    objects = []
    # 1: Catalog
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    # 2: Pages
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    # 3: Page
    objects.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>")
    # 4: Contents
    objects.append(f"<< /Length {stream_len} >>\nstream\n".encode("latin1") + stream_content + b"\nendstream")
    # 5: Font F1 (Helvetica-Bold)
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    # 6: Font F2 (Helvetica)
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    pdf_bytes = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objects):
        offsets.append(len(pdf_bytes))
        pdf_bytes.extend(f"{i+1} 0 obj\n".encode("latin1"))
        pdf_bytes.extend(obj)
        pdf_bytes.extend(b"\nendobj\n")

    xref_pos = len(pdf_bytes)
    pdf_bytes.extend(f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n".encode("latin1"))
    for off in offsets:
        pdf_bytes.extend(f"{off:010d} 00000 n \n".encode("latin1"))

    pdf_bytes.extend(f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("latin1"))

    with open(output_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"Standard PDF generated: {output_path} ({len(pdf_bytes)} bytes)")

if __name__ == "__main__":
    pdf_path = os.path.abspath("SpendWise_AI_Project_Summary.pdf")
    create_styled_pdf(pdf_path)
