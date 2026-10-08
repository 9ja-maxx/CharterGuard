import importlib.util
import json
import sys
import types
import typing
from pathlib import Path
import pytest

AUTHOR_A = "0x1111111111111111111111111111111111111111"
AUDITOR_B = "0x2222222222222222222222222222222222222222"
OUTSIDER_C = "0x3333333333333333333333333333333333333333"

CHARTER_BASELINE_TEXT = (
    "Establish the Core Infrastructure Security Bounty mandate with an allocation of 5000 units. "
    "Funds are released exclusively to the verified security council upon delivery of an audited report."
)

AMENDMENT_DISCLOSED_TEXT = (
    "Establish the Core Infrastructure Security Bounty mandate with an increased allocation of 6500 units. "
    "The 1500 unit expansion funds emergency formal verification across zero-knowledge rollup bridges."
)

AMENDMENT_CONCEALED_TEXT = (
    "Establish the Core Infrastructure Security Bounty mandate with an allocation of 8000 units redirected "
    "to an anonymous multisig address. The recipient guild may disburse funds at their sole discretion."
)

CHANGELOG_DISCLOSED = (
    "Discloses the budget expansion from 5000 to 6500 units for emergency zero-knowledge bridge formal verification."
)

CHANGELOG_MISLEADING = (
    "Minor syntax polishing, formatting fixes, and administrative cleanup."
)

BASELINE_ACTIONS = [
    {
        "target": "0x" + "a" * 40,
        "selector": "0x12345678",
        "value": 0,
        "asset": "NATIVE",
        "recipient": "0x" + "b" * 40,
        "amount": 5000,
    }
]

EXPANDED_ACTIONS = [
    {
        **BASELINE_ACTIONS[0],
        "amount": 6500,
    }
]

MUTATED_RECIPIENT_ACTIONS = [
    {
        **BASELINE_ACTIONS[0],
        "recipient": "0x" + "c" * 40,
        "amount": 8000,
    }
]


class TreeMap(dict):
    @classmethod
    def __class_getitem__(cls, _):
        return cls


class U256(int):
    pass


class ContractBase:
    pass


class UserError(Exception):
    pass


class VMError(Exception):
    pass


class Public:
    @staticmethod
    def write(fn):
        return fn

    @staticmethod
    def view(fn):
        return fn


class Nondet:
    def __init__(self):
        self.answer = {
            "decision": "FULLY_DISCLOSED",
            "material_impacts": ["EXECUTABLE_ACTION_DELTA", "AUTHORITY_EXPANSION"],
            "disclosure_complete": True,
            "scope_broadened": True,
        }
        self.prompts = []

    def exec_prompt(self, prompt, **_):
        self.prompts.append(prompt)
        return self.answer


class Eq:
    def __init__(self):
        self.forced_verdict = None

    def prompt_comparative(self, fn, *_, **__):
        return self.forced_verdict if self.forced_verdict is not None else fn()


@pytest.fixture
def runtime(monkeypatch):
    nondet = Nondet()
    eq = Eq()
    gl_mock = types.ModuleType("genlayer")
    gl_mock.__all__ = ["gl", "u256", "TreeMap", "typing"]
    gl_mock.gl = gl_mock
    gl_mock.Contract = ContractBase
    gl_mock.public = Public()
    gl_mock.nondet = nondet
    gl_mock.eq_principle = eq
    gl_mock.message = types.SimpleNamespace(sender_address=AUTHOR_A)
    gl_mock.message_raw = {"datetime": "2026-10-08T00:00:00+00:00"}
    gl_mock.u256 = U256
    gl_mock.TreeMap = TreeMap
    gl_mock.typing = types.SimpleNamespace(Any=object, Optional=typing.Optional)
    gl_mock.vm = types.SimpleNamespace(UserError=UserError, VMError=VMError)

    monkeypatch.setitem(sys.modules, "genlayer", gl_mock)

    contract_path = Path(__file__).parent.parent / "contracts" / "charter_guard.py"
    spec = importlib.util.spec_from_file_location("charter_guard_test", contract_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    contract_instance = module.CharterGuard()
    return module, contract_instance, gl_mock, nondet, eq


def set_caller(gl_mock, address: str):
    gl_mock.message.sender_address = address


def helper_create_charter(contract, title="Treasury Security Directive", domain="SECURITY_DIRECTIVE"):
    return contract.register_charter(
        title,
        domain,
        CHARTER_BASELINE_TEXT,
        json.dumps(BASELINE_ACTIONS),
    )


def helper_propose_amendment(
    contract,
    gl_mock,
    charter_id=1,
    revised_text=AMENDMENT_DISCLOSED_TEXT,
    changelog=CHANGELOG_DISCLOSED,
    actions=EXPANDED_ACTIONS,
):
    charter = contract.get_charter(charter_id)
    active_amendment = contract.get_amendment(charter["active_amendment_id"])
    set_caller(gl_mock, AUDITOR_B)
    return contract.propose_amendment(
        charter_id,
        charter["current_epoch"],
        active_amendment["text_hash"],
        revised_text,
        changelog,
        json.dumps(actions),
    )
