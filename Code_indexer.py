import math
import os
import re
import sqlite3
import string
import time
from collections import Counter, defaultdict


class PorterStemmer:
    """Porter stemming algorithm (classic Porter stemmer)."""

    def __init__(self):
        self.b = ""
        self.k = 0
        self.k0 = 0
        self.j = 0

    def cons(self, i):
        if self.b[i] in "aeiou":
            return False
        if self.b[i] == "y":
            if i == self.k0:
                return True
            return not self.cons(i - 1)
        return True

    def m(self):
        n = 0
        i = self.k0
        while True:
            if i > self.j:
                return n
            if not self.cons(i):
                break
            i += 1
        i += 1
        while True:
            while True:
                if i > self.j:
                    return n
                if self.cons(i):
                    break
                i += 1
            i += 1
            n += 1
            while True:
                if i > self.j:
                    return n
                if not self.cons(i):
                    break
                i += 1
            i += 1

    def vowel_in_stem(self):
        for i in range(self.k0, self.j + 1):
            if not self.cons(i):
                return True
        return False

    def doublec(self, j):
        if j < (self.k0 + 1):
            return False
        if self.b[j] != self.b[j - 1]:
            return False
        return self.cons(j)

    def cvc(self, i):
        if i < (self.k0 + 2) or not self.cons(i) or self.cons(i - 1) or not self.cons(i - 2):
            return False
        ch = self.b[i]
        return ch not in ("w", "x", "y")

    def ends(self, s):
        length = len(s)
        o = self.k - length + 1
        if o < self.k0:
            return False
        if self.b[o : self.k + 1] != s:
            return False
        self.j = self.k - length
        return True

    def setto(self, s):
        length = len(s)
        self.b = self.b[: self.j + 1] + s + self.b[self.j + length + 1 :]
        self.k = self.j + length

    def r(self, s):
        if self.m() > 0:
            self.setto(s)

    def step1ab(self):
        if self.b[self.k] == "s":
            if self.ends("sses"):
                self.k -= 2
            elif self.ends("ies"):
                self.setto("i")
            elif self.b[self.k - 1] != "s":
                self.k -= 1
        if self.ends("eed"):
            if self.m() > 0:
                self.k -= 1
        elif (self.ends("ed") or self.ends("ing")) and self.vowel_in_stem():
            self.k = self.j
            if self.ends("at"):
                self.setto("ate")
            elif self.ends("bl"):
                self.setto("ble")
            elif self.ends("iz"):
                self.setto("ize")
            elif self.doublec(self.k):
                self.k -= 1
                if self.b[self.k] in ("l", "s", "z"):
                    self.k += 1
            elif self.m() == 1 and self.cvc(self.k):
                self.setto("e")

    def step1c(self):
        if self.ends("y") and self.vowel_in_stem():
            self.b = self.b[: self.k] + "i" + self.b[self.k + 1 :]

    def step2(self):
        if self.k == self.k0:
            return
        ch = self.b[self.k - 1]
        if ch == "a":
            if self.ends("ational"):
                self.r("ate")
            elif self.ends("tional"):
                self.r("tion")
        elif ch == "c":
            if self.ends("enci"):
                self.r("ence")
            elif self.ends("anci"):
                self.r("ance")
        elif ch == "e":
            if self.ends("izer"):
                self.r("ize")
        elif ch == "l":
            if self.ends("bli"):
                self.r("ble")
            elif self.ends("alli"):
                self.r("al")
            elif self.ends("entli"):
                self.r("ent")
            elif self.ends("eli"):
                self.r("e")
            elif self.ends("ousli"):
                self.r("ous")
        elif ch == "o":
            if self.ends("ization"):
                self.r("ize")
            elif self.ends("ation"):
                self.r("ate")
            elif self.ends("ator"):
                self.r("ate")
        elif ch == "s":
            if self.ends("alism"):
                self.r("al")
            elif self.ends("iveness"):
                self.r("ive")
            elif self.ends("fulness"):
                self.r("ful")
            elif self.ends("ousness"):
                self.r("ous")
        elif ch == "t":
            if self.ends("aliti"):
                self.r("al")
            elif self.ends("iviti"):
                self.r("ive")
            elif self.ends("biliti"):
                self.r("ble")
        elif ch == "g":
            if self.ends("logi"):
                self.r("log")

    def step3(self):
        ch = self.b[self.k]
        if ch == "e":
            if self.ends("icate"):
                self.r("ic")
            elif self.ends("ative"):
                self.r("")
            elif self.ends("alize"):
                self.r("al")
        elif ch == "i":
            if self.ends("iciti"):
                self.r("ic")
        elif ch == "l":
            if self.ends("ical"):
                self.r("ic")
            elif self.ends("ful"):
                self.r("")
        elif ch == "s":
            if self.ends("ness"):
                self.r("")

    def step4(self):
        if self.k <= self.k0:
            return
        ch = self.b[self.k - 1]
        if ch == "a":
            if not self.ends("al"):
                return
        elif ch == "c":
            if not (self.ends("ance") or self.ends("ence")):
                return
        elif ch == "e":
            if not self.ends("er"):
                return
        elif ch == "i":
            if not self.ends("ic"):
                return
        elif ch == "l":
            if not (self.ends("able") or self.ends("ible")):
                return
        elif ch == "n":
            if not (self.ends("ant") or self.ends("ement") or self.ends("ment") or self.ends("ent")):
                return
        elif ch == "o":
            if self.ends("ion"):
                if self.j < self.k0 or self.b[self.j] not in ("s", "t"):
                    return
            elif not self.ends("ou"):
                return
        elif ch == "s":
            if not self.ends("ism"):
                return
        elif ch == "t":
            if not (self.ends("ate") or self.ends("iti")):
                return
        elif ch == "u":
            if not self.ends("ous"):
                return
        elif ch == "v":
            if not self.ends("ive"):
                return
        elif ch == "z":
            if not self.ends("ize"):
                return
        else:
            return
        if self.m() > 1:
            self.k = self.j

    def step5(self):
        self.j = self.k
        if self.b[self.k] == "e":
            a = self.m()
            if a > 1 or (a == 1 and not self.cvc(self.k - 1)):
                self.k -= 1
        if self.b[self.k] == "l" and self.doublec(self.k) and self.m() > 1:
            self.k -= 1

    def stem(self, p, i, j):
        self.b = p
        self.k = j
        self.k0 = i
        if self.k <= self.k0 + 1:
            return self.b
        self.step1ab()
        self.step1c()
        self.step2()
        self.step3()
        self.step4()
        self.step5()
        return self.b[self.k0 : self.k + 1]


STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "can", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
    "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i",
    "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most",
    "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
    "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
    "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your",
    "yours", "yourself", "yourselves",
}

TOKEN_EDGE_CLEANER = re.compile(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$")


def collect_files(root_dir):
    files = []
    for cur_root, dirnames, filenames in os.walk(root_dir):
        dirnames.sort()
        filenames.sort()
        for name in filenames:
            files.append(os.path.join(cur_root, name))
    return files


def iter_raw_tokens(line):
    for raw in line.replace("\t", " ").split():
        cleaned = raw.strip()
        if cleaned:
            yield cleaned


def normalize_token(raw_token, stemmer):
    token = raw_token.lower()
    if token[0] in string.punctuation:
        return None, "punctuation_start"
    token = TOKEN_EDGE_CLEANER.sub("", token)
    if not token:
        return None, "empty"
    if token in STOP_WORDS:
        return None, "stopword"
    stemmed = stemmer.stem(token, 0, len(token) - 1)
    return stemmed, "ok"


def create_schema(cur):
    cur.executescript(
        """
        DROP TABLE IF EXISTS DocumentDictionary;
        DROP TABLE IF EXISTS TermDictionary;
        DROP TABLE IF EXISTS Posting;

        CREATE TABLE DocumentDictionary (
            DocId INTEGER PRIMARY KEY,
            DocumentName TEXT NOT NULL
        );

        CREATE TABLE TermDictionary (
            TermId INTEGER PRIMARY KEY,
            Term TEXT NOT NULL UNIQUE,
            DocFreq INTEGER NOT NULL,
            Idf REAL NOT NULL
        );

        CREATE TABLE Posting (
            TermId INTEGER NOT NULL,
            DocId INTEGER NOT NULL,
            TermFreq INTEGER NOT NULL,
            DocFreq INTEGER NOT NULL,
            TfIdf REAL NOT NULL,
            PRIMARY KEY (TermId, DocId),
            FOREIGN KEY (TermId) REFERENCES TermDictionary(TermId),
            FOREIGN KEY (DocId) REFERENCES DocumentDictionary(DocId)
        );

        CREATE INDEX idx_document_docid ON DocumentDictionary(DocId);
        CREATE INDEX idx_term_termid ON TermDictionary(TermId);
        CREATE INDEX idx_posting_termid ON Posting(TermId);
        CREATE INDEX idx_posting_docid ON Posting(DocId);
        """
    )


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    corpus_dir = os.path.join(script_dir, "cacm")
    db_path = os.path.join(script_dir, "indexer_unit4.db")

    if not os.path.isdir(corpus_dir):
        raise SystemExit(f"Corpus directory not found: {corpus_dir}")

    start_time = time.localtime()
    print("Processing Start Time: %.2d:%.2d" % (start_time.tm_hour, start_time.tm_min))

    doc_paths = collect_files(corpus_dir)
    documents_processed = len(doc_paths)

    stemmer = PorterStemmer()
    total_terms_parsed = 0
    total_stopword_matches = 0
    inverted_index = defaultdict(dict)  # term -> {doc_id: tf}

    con = sqlite3.connect(db_path)
    con.isolation_level = None
    cur = con.cursor()
    create_schema(cur)

    for doc_id, path in enumerate(doc_paths, start=1):
        rel_path = os.path.relpath(path, corpus_dir)
        cur.execute(
            "INSERT INTO DocumentDictionary (DocId, DocumentName) VALUES (?, ?)",
            (doc_id, rel_path),
        )

        doc_tf = Counter()
        with open(path, "r", errors="ignore") as fh:
            for line in fh:
                for raw in iter_raw_tokens(line):
                    total_terms_parsed += 1
                    token, status = normalize_token(raw, stemmer)
                    if status == "stopword":
                        total_stopword_matches += 1
                        continue
                    if status != "ok":
                        continue
                    doc_tf[token] += 1

        for term, tf in doc_tf.items():
            inverted_index[term][doc_id] = tf

    sorted_terms = sorted(inverted_index.keys())
    term_id_map = {term: idx for idx, term in enumerate(sorted_terms, start=1)}
    n_docs = documents_processed

    for term in sorted_terms:
        term_id = term_id_map[term]
        postings = inverted_index[term]
        df = len(postings)
        idf = math.log10(n_docs / float(df)) if df else 0.0

        cur.execute(
            "INSERT INTO TermDictionary (TermId, Term, DocFreq, Idf) VALUES (?, ?, ?, ?)",
            (term_id, term, df, idf),
        )

        for doc_id, tf in sorted(postings.items()):
            tf_idf = tf * idf
            cur.execute(
                "INSERT INTO Posting (TermId, DocId, TermFreq, DocFreq, TfIdf) VALUES (?, ?, ?, ?, ?)",
                (term_id, doc_id, tf, df, tf_idf),
            )

    con.commit()
    con.close()

    end_time = time.localtime()
    print("Processing End Time: %.2d:%.2d" % (end_time.tm_hour, end_time.tm_min))
    print("Number of documents processed:", documents_processed)
    print("Total number of terms parsed from all documents:", total_terms_parsed)
    print("Total number of unique terms found and added to the index:", len(sorted_terms))
    print("Total number of terms matching stop words:", total_stopword_matches)
    print(f"SQLite index database created: {db_path}")


if __name__ == "__main__":
    main()
