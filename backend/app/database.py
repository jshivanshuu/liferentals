from .schemas import Property, Referral, Transaction, User


users: dict[int, User] = {}
properties: dict[int, Property] = {}
transactions: dict[int, Transaction] = {}
referrals: dict[int, Referral] = {}


def next_id(records: dict[int, object]) -> int:
    if not records:
        return 1
    return max(records) + 1
