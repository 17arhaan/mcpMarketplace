"""Lightweight content moderation for user-generated text.

Catches the obvious cases — profanity, slurs, spam patterns. Not a replacement
for a real moderation pipeline; just a first line of defense.
"""

import re

# Common profanity / slurs (substring match, case-insensitive). Keep short —
# this list is the kind of thing that would normally live in a config service.
_BANNED_SUBSTRINGS = {
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "cunt",
    "dick",
    "pussy",
    "cock",
    "nigger",
    "nigga",
    "faggot",
    "retard",
    "retarded",
    "whore",
    "slut",
    "bastard",
    "tranny",
    "kike",
    "spic",
    "chink",
    "gook",
    "wetback",
    "rape",
    "rapist",
    "pedo",
    "pedophile",
    "child porn",
    "cp",  # only via word boundary check below
    "kys",  # kill yourself
}

# Words we only flag with strict word boundaries (avoid false positives on
# substrings of legitimate words — e.g. "cp" in "scp", "tcp").
_WORD_BOUNDARY_ONLY = {"cp", "kys"}

_RESERVED_USERNAMES = {
    "admin",
    "administrator",
    "root",
    "system",
    "official",
    "support",
    "help",
    "moderator",
    "mod",
    "staff",
    "team",
    "mcp",
    "mcp-get",
    "anthropic",
    "claude",
    "null",
    "undefined",
    "anonymous",
}


class ModerationError(ValueError):
    """Raised when content fails moderation checks."""


def is_clean(text: str) -> bool:
    """Return True if text passes moderation."""
    if not text:
        return True
    lower = text.lower()
    for word in _BANNED_SUBSTRINGS:
        if word in _WORD_BOUNDARY_ONLY:
            if re.search(rf"\b{re.escape(word)}\b", lower):
                return False
        elif word in lower:
            return False
    return True


def check_text(text: str, *, field: str = "text") -> None:
    """Raise ModerationError if text contains banned content."""
    if not is_clean(text):
        raise ModerationError(f"{field} contains inappropriate language")


def check_username(username: str) -> None:
    """Validate a username — format, reserved words, profanity."""
    if not username or len(username) < 3:
        raise ModerationError("username must be at least 3 characters")
    if len(username) > 30:
        raise ModerationError("username must be 30 characters or fewer")
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", username):
        raise ModerationError("username may only contain letters, numbers, _ and -")
    if username.lower() in _RESERVED_USERNAMES:
        raise ModerationError("username is reserved")
    check_text(username, field="username")
