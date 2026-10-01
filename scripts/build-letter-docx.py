from docx import Document
from docx.enum.text import WD_BREAK, WD_LINE_SPACING
from docx.shared import Inches, Pt


FONT = "Times New Roman"
SIZE = Pt(11)

STUDENT_INTRO = (
    "I am Hervin ISHIMWE, Registration No. 222020348, "
    "a final-year student in the Department of Information Technology, "
    "School of ICT, College of Science and Technology, University of Rwanda."
)


def setup_page(doc: Document) -> None:
    section = doc.sections[0]
    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)


def add_paragraph(doc: Document, text: str, *, bold: bool = False, space_after: Pt = Pt(0)) -> None:
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    run.font.name = FONT
    run.font.size = SIZE
    fmt = p.paragraph_format
    fmt.line_spacing_rule = WD_LINE_SPACING.SINGLE
    fmt.space_before = Pt(0)
    fmt.space_after = space_after


def add_letterhead(doc: Document) -> None:
    """Summarized header — 2 lines."""
    add_paragraph(
        doc,
        "UNIVERSITY OF RWANDA — College of Science and Technology (CST)",
        bold=True,
        space_after=Pt(0),
    )
    add_paragraph(doc, "P.O. Box 3900, KN 67 Street, Nyarugenge, Kigali, Rwanda", space_after=Pt(6))


def add_recipient(doc: Document) -> None:
    """Summarized addressee block — 3 lines."""
    add_paragraph(doc, "The Dean, College of Science and Technology, University of Rwanda")
    add_paragraph(
        doc,
        "Through: Head of Department, Information Technology, School of ICT, UR-CST",
        space_after=Pt(6),
    )


def add_signature_block(doc: Document) -> None:
    """Summarized footer — 4 lines."""
    add_paragraph(doc, "Hervin ISHIMWE  |  Registration No.: 222020348", space_after=Pt(0))
    add_paragraph(doc, "Department of IT, School of ICT, UR-CST", space_after=Pt(0))
    add_paragraph(doc, "Tel: 0781011343  |  Email: ishimwehervin10@gmail.com", space_after=Pt(6))
    add_paragraph(doc, "Signature: ___________________", space_after=Pt(0))


def add_letter(doc: Document, date: str, subject: str, body_paragraphs: list[str]) -> None:
    add_paragraph(doc, date, space_after=Pt(6))
    add_recipient(doc)
    add_paragraph(doc, f"RE: {subject}", bold=True, space_after=Pt(4))
    add_paragraph(doc, "Dear Sir/Madam,", space_after=Pt(4))

    for text in body_paragraphs:
        add_paragraph(doc, text, space_after=Pt(4))

    add_paragraph(doc, "Thank you for your time and consideration.", space_after=Pt(6))
    add_paragraph(doc, "Yours faithfully,", space_after=Pt(8))
    add_signature_block(doc)


def main() -> None:
    doc = Document()
    setup_page(doc)

    add_letterhead(doc)
    add_letter(
        doc,
        "18 August 2026",
        "REQUEST FOR A LETTER CONFIRMING COMPLETION OF FINAL-YEAR STUDIES",
        [
            STUDENT_INTRO,
            'I respectfully request the issuance of a "To Whom It May Concern" letter confirming that I have successfully completed all academic requirements for the final year of my programme and that I am currently awaiting the official graduation ceremony and conferment of my degree.',
            "I require this letter to support my applications for which proof of completion of my studies is needed before official graduation and the issuance of my degree certificate.",
            "I would be grateful if my request could be considered and the letter issued at your earliest convenience.",
        ],
    )

    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    add_letterhead(doc)
    add_letter(
        doc,
        "18 August 2026",
        "REQUEST FOR ISSUANCE OF YEAR FOUR ACADEMIC TRANSCRIPT",
        [
            STUDENT_INTRO,
            "I respectfully request the issuance of my Year Four academic transcript showing my final-year academic results.",
            "I require this transcript to support my academic and professional applications while I await the official graduation ceremony and the issuance of my degree certificate.",
            "I would be grateful if my request could be processed and the transcript issued at your earliest convenience.",
        ],
    )

    output = "LETTER-final.docx"
    try:
        doc.save(output)
    except PermissionError:
        output = "LETTER-final-v2.docx"
        doc.save(output)
    print(f"Created {output} (2 pages, summarized header & footer)")


if __name__ == "__main__":
    main()
