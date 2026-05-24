import {
  BarChart3,
  Building2,
  CheckCircle2,
  FileDown,
  Info,
  Lightbulb,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { compareAssetScenario } from "../domain/cgt/calculator";
import { calculateCurrentCgt } from "../domain/cgt/currentRules";
import { calculateReformCgt } from "../domain/cgt/reform2027";
import type { Asset, AssetKind, SaleScenario, TaxProfile } from "../domain/cgt/types";
import { appAssumptions, policySources } from "../data/policySources";
import {
  clearPortfolioState,
  loadPortfolioState,
  savePortfolioState,
  type PortfolioState,
} from "../data/portfolioStorage";
import { assetKindLabel, money, percent, shortDate } from "./format";

type Screen = "Portfolio" | "Scenarios" | "Compare" | "Assumptions" | "Sources";

const screens: Screen[] = ["Portfolio", "Scenarios", "Compare", "Assumptions", "Sources"];

const scenarioPresets = [
  {
    id: "before-reform",
    label: "Sell before reform",
    saleDate: "2027-06-15",
    cpiAtSale: 131,
    income: 150_000,
    changed: "Sale happens before 1 July 2027.",
  },
  {
    id: "base-fy2028",
    label: "Sell after reform",
    saleDate: "2028-09-01",
    cpiAtSale: 139,
    income: 150_000,
    changed: "Base post-reform sale timing.",
  },
  {
    id: "higher-income",
    label: "Sell in higher-income year",
    saleDate: "2028-09-01",
    cpiAtSale: 139,
    income: 230_000,
    changed: "Only your other taxable income changes.",
  },
  {
    id: "lower-income",
    label: "Sell in lower-income year",
    saleDate: "2028-09-01",
    cpiAtSale: 139,
    income: 35_000,
    changed: "Only your other taxable income changes.",
  },
  {
    id: "lower-cpi",
    label: "Lower inflation outcome",
    saleDate: "2029-09-01",
    cpiAtSale: 140,
    income: 150_000,
    changed: "Later sale with lower CPI indexation.",
  },
  {
    id: "higher-cpi",
    label: "Higher inflation outcome",
    saleDate: "2029-09-01",
    cpiAtSale: 151,
    income: 150_000,
    changed: "Later sale with higher CPI indexation.",
  },
];

type ScenarioOutcome = {
  currentTax: number;
  reformTax: number;
  taxDelta: number;
  proceedsDelta: number;
  currentAfterTaxProceeds: number;
  reformAfterTaxProceeds: number;
  minimumTaxTopUp: number;
  taxableGain: number;
};

type DecisionOption = {
  id: string;
  label: string;
  group: "full-sale" | "staged-share";
  changed: string;
  takeaway: string;
  saleDateLabel: string;
  incomeLabel: string;
  portionLabel: string;
  outcome: ScenarioOutcome;
};

type NextMove = {
  title: string;
  detail: string;
  impact: string;
  intent?: "good" | "bad";
};

export function App() {
  const [screen, setScreen] = useState<Screen>("Portfolio");
  const [state, setState] = useState<PortfolioState>(() => loadPortfolioState());
  const selectedAsset = state.assets.find((asset) => asset.id === state.scenario.assetId) ?? state.assets[0];

  useEffect(() => {
    savePortfolioState(state);
  }, [state]);

  const scenario = useMemo(() => {
    if (!selectedAsset) {
      return null;
    }

    return compareAssetScenario(effectiveAssetForCalculation(selectedAsset), state.scenario, state.profile);
  }, [selectedAsset, state.profile, state.scenario]);

  function updateProfile(patch: Partial<TaxProfile>) {
    setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  }

  function updateActiveScenario(patch: Partial<SaleScenario>) {
    setState((current) => {
      const selectedAsset = patch.assetId ? current.assets.find((asset) => asset.id === patch.assetId) : undefined;
      const nextScenario = {
        ...current.scenario,
        ...patch,
        saleDate: patch.assetId
          ? patch.saleDate ?? selectedAsset?.plannedSaleDate ?? current.scenario.saleDate
          : patch.saleDate ?? current.scenario.saleDate,
        saleProceeds: patch.assetId
          ? patch.saleProceeds ?? plannedSaleTotal(selectedAsset) ?? selectedAsset?.currentValue ?? current.scenario.saleProceeds
          : patch.saleProceeds ?? current.scenario.saleProceeds,
        sellingCosts: patch.assetId
          ? patch.sellingCosts ?? selectedAsset?.saleCostEstimate ?? current.scenario.sellingCosts
          : patch.sellingCosts ?? current.scenario.sellingCosts,
      };

      return {
        ...current,
        scenario: nextScenario,
        assets: current.assets.map((asset) => {
          if (asset.id !== current.scenario.assetId) {
            return asset;
          }

          return {
            ...asset,
            plannedSaleDate: patch.saleDate ?? asset.plannedSaleDate,
            plannedSalePrice: patch.saleProceeds ?? asset.plannedSalePrice,
            saleCostEstimate: patch.sellingCosts ?? asset.saleCostEstimate,
          };
        }),
      };
    });
  }

  function selectAsset(assetId: string) {
    setState((current) => {
      const asset = current.assets.find((item) => item.id === assetId);
      return {
        ...current,
        scenario: {
          ...current.scenario,
          assetId,
          saleDate: asset?.plannedSaleDate ?? current.scenario.saleDate,
          saleProceeds: plannedSaleTotal(asset) ?? asset?.currentValue ?? current.scenario.saleProceeds,
          sellingCosts: asset?.saleCostEstimate ?? current.scenario.sellingCosts,
        },
      };
    });
  }

  function updateAsset(assetId: string, patch: Partial<Asset>) {
    setState((current) => ({
      ...current,
      assets: current.assets.map((asset) => (asset.id === assetId ? { ...asset, ...patch } : asset)),
    }));
  }

  function addAsset(kind: AssetKind) {
    const id = `${kind}-${Date.now()}`;
    const asset: Asset = {
      id,
      kind,
      name: kind === "share_parcel" ? "New share parcel" : "New investment property",
      acquisitionDate: "2024-07-01",
      ownershipShare: 1,
      purchasePrice: kind === "share_parcel" ? undefined : 720_000,
      stampDuty: kind === "share_parcel" ? undefined : 24_000,
      buyingCosts: kind === "share_parcel" ? undefined : 6_000,
      capitalImprovements: kind === "share_parcel" ? undefined : 0,
      units: kind === "share_parcel" ? 500 : undefined,
      costPerUnit: kind === "share_parcel" ? 99 : undefined,
      brokerage: kind === "share_parcel" ? 500 : undefined,
      costBaseAdjustments: kind === "share_parcel" ? 0 : undefined,
      costBase: kind === "share_parcel" ? 50_000 : 750_000,
      currentPrice: kind === "share_parcel" ? 130 : undefined,
      currentValue: kind === "share_parcel" ? 65_000 : 800_000,
      priceAtPolicyStart: kind === "share_parcel" ? 144 : undefined,
      valueAtPolicyStart: kind === "share_parcel" ? 72_000 : 840_000,
      saleCostEstimate: kind === "share_parcel" ? 300 : 22_000,
      plannedSaleDate: "2028-09-01",
      plannedSaleUnitPrice: kind === "share_parcel" ? 150 : undefined,
      plannedSalePrice: kind === "share_parcel" ? 75_000 : 860_000,
      isEligibleNewBuild: false,
      annualRent: kind === "residential_property" ? 34_000 : undefined,
      loanBalance: kind === "residential_property" ? 650_000 : undefined,
      interestRate: kind === "residential_property" ? 0.065 : undefined,
      annualInterest: undefined,
      annualDeductibleExpenses: kind === "residential_property" ? 7_000 : undefined,
      annualDepreciation: kind === "residential_property" ? 3_000 : undefined,
    };

    setState((current) => ({
      ...current,
      assets: [...current.assets, asset],
      scenario: {
        ...current.scenario,
        assetId: id,
        saleDate: asset.plannedSaleDate ?? current.scenario.saleDate,
        saleProceeds: plannedSaleTotal(asset) ?? asset.currentValue,
        sellingCosts: asset.saleCostEstimate ?? current.scenario.sellingCosts,
      },
    }));
  }

  function removeAsset(assetId: string) {
    setState((current) => {
      const assets = current.assets.filter((asset) => asset.id !== assetId);
      return {
        ...current,
        assets,
        scenario: {
          ...current.scenario,
          assetId: current.scenario.assetId === assetId ? assets[0]?.id ?? "" : current.scenario.assetId,
        },
      };
    });
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">CGT</div>
          <div>
            <strong>Impact Calculator</strong>
            <span>Australian resident MVP</span>
          </div>
        </div>
        <nav className="nav">
          {screens.map((item) => (
            <button key={item} className={screen === item ? "active" : ""} onClick={() => setScreen(item)}>
              {item === "Portfolio" && <Building2 aria-hidden="true" size={17} />}
              {item === "Scenarios" && <Scale aria-hidden="true" size={17} />}
              {item === "Compare" && <BarChart3 aria-hidden="true" size={17} />}
              {item === "Assumptions" && <Info aria-hidden="true" size={17} />}
              {item === "Sources" && <Share2 aria-hidden="true" size={17} />}
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebarNote">
          Local-only MVP. Figures are estimates for accountant/adviser discussion, not tax advice.
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">2026-27 Budget reform modeller</p>
            <h1>{screen}</h1>
            <p>Compare current CGT settings against announced post-1 July 2027 reform rules.</p>
          </div>
          <div className="toolbar">
            <button
              className="iconButton"
              title="Print or save scenario summary"
              aria-label="Print or save scenario summary"
              onClick={() => window.print()}
            >
              <FileDown aria-hidden="true" size={17} />
            </button>
            <button
              className="iconButton"
              title="Reset sample workspace"
              aria-label="Reset sample workspace"
              onClick={() => setState(clearPortfolioState())}
            >
              <RotateCcw aria-hidden="true" size={17} />
            </button>
          </div>
        </header>

        {screen === "Portfolio" && (
          <PortfolioScreen
            assets={state.assets}
            scenario={state.scenario}
            profile={state.profile}
            selectedAsset={selectedAsset}
            onAdd={addAsset}
            onSelect={selectAsset}
            onAssetChange={(assetId, patch) => updateAsset(assetId, patch)}
            onScenarioChange={updateActiveScenario}
            onRemove={removeAsset}
          />
        )}
        {screen === "Scenarios" && selectedAsset && scenario && (
          <ScenarioScreen
            asset={selectedAsset}
            assets={state.assets}
            profile={state.profile}
            scenario={state.scenario}
            result={scenario}
            onProfileChange={updateProfile}
            onScenarioChange={updateActiveScenario}
            onAssetChange={(patch) => updateAsset(selectedAsset.id, patch)}
          />
        )}
        {screen === "Compare" && selectedAsset && (
          <CompareScreen asset={selectedAsset} scenario={state.scenario} profile={state.profile} />
        )}
        {screen === "Assumptions" && (
          <AssumptionsScreen profile={state.profile} onProfileChange={updateProfile} />
        )}
        {screen === "Sources" && <SourcesScreen />}
      </main>
    </div>
  );
}

function PortfolioScreen({
  assets,
  scenario,
  profile,
  selectedAsset,
  onAdd,
  onSelect,
  onAssetChange,
  onScenarioChange,
  onRemove,
}: {
  assets: Asset[];
  scenario: SaleScenario;
  profile: TaxProfile;
  selectedAsset?: Asset;
  onAdd: (kind: AssetKind) => void;
  onSelect: (assetId: string) => void;
  onAssetChange: (assetId: string, patch: Partial<Asset>) => void;
  onScenarioChange: (patch: Partial<SaleScenario>) => void;
  onRemove: (assetId: string) => void;
}) {
  return (
    <section className="screenPanel">
      <div className="panelHeader">
        <div>
          <h2>Portfolio workspace</h2>
          <p>Assets stay in this browser. Select a row to edit its details and drive the scenario screens.</p>
        </div>
        <div className="toolbar">
          <button onClick={() => onAdd("residential_property")}>
            <Plus aria-hidden="true" size={16} /> Property
          </button>
          <button onClick={() => onAdd("share_parcel")}>
            <Plus aria-hidden="true" size={16} /> Share parcel
          </button>
        </div>
      </div>
      <div className="portfolioLayout">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Acquired</th>
                <th>Cost base</th>
                <th>Current value</th>
                <th>Unrealised gain</th>
                <th>Reform exposure</th>
                <th>Negative gearing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {assets.map((asset) => {
              const assetScenario = {
                ...scenario,
                assetId: asset.id,
                saleDate: asset.plannedSaleDate ?? scenario.saleDate,
                saleProceeds: plannedSaleTotal(asset) ?? asset.currentValue,
                sellingCosts: asset.saleCostEstimate ?? scenario.sellingCosts,
              };
                const effectiveAsset = effectiveAssetForCalculation(asset);
                const comparison = compareAssetScenario(effectiveAsset, assetScenario, profile);
                const ng = comparison.negativeGearing;
                return (
                  <tr key={asset.id} className={scenario.assetId === asset.id ? "selectedRow" : ""}>
                    <td>
                      <button className="linkButton" onClick={() => onSelect(asset.id)}>
                        {asset.name}
                      </button>
                      <div className="muted">{percent(asset.ownershipShare)} owned</div>
                    </td>
                    <td>{assetKindLabel(asset.kind)}</td>
                    <td>{asset.acquisitionDate}</td>
                    <td>{money(effectiveAsset.costBase * asset.ownershipShare)}</td>
                    <td>{money(effectiveAsset.currentValue * asset.ownershipShare)}</td>
                    <td>{money((effectiveAsset.currentValue - effectiveAsset.costBase) * asset.ownershipShare)}</td>
                    <td>
                      <ExposureBadges asset={effectiveAsset} result={comparison} />
                    </td>
                    <td>
                      <span className={`badge ${ng.status === "quarantined" ? "danger" : "neutral"}`}>
                        {ng.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="rowActions">
                        <button
                          className="iconButton"
                          title="Edit asset details"
                          aria-label={`Edit ${asset.name}`}
                          onClick={() => onSelect(asset.id)}
                        >
                          <Pencil aria-hidden="true" size={16} />
                        </button>
                        <button
                          className="iconButton"
                          title="Delete asset"
                          aria-label={`Delete ${asset.name}`}
                          onClick={() => onRemove(asset.id)}
                        >
                          <Trash2 aria-hidden="true" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {selectedAsset && (
          <AssetDetailEditor
            asset={selectedAsset}
            scenario={scenario}
            onChange={(patch) => onAssetChange(selectedAsset.id, patch)}
            onScenarioChange={onScenarioChange}
          />
        )}
      </div>
    </section>
  );
}

function AssetDetailEditor({
  asset,
  scenario,
  onChange,
  onScenarioChange,
}: {
  asset: Asset;
  scenario: SaleScenario;
  onChange: (patch: Partial<Asset>) => void;
  onScenarioChange: (patch: Partial<SaleScenario>) => void;
}) {
  const isProperty = asset.kind === "residential_property" || asset.kind === "commercial_property";
  const propertyCostBase =
    calculatedPropertyCostBase(asset);
  const shareCostBase = calculatedShareCostBase(asset);
  const calculatedCurrentValue = calculatedShareCurrentValue(asset);
  const calculatedPolicyStartValue = calculatedSharePolicyStartValue(asset);
  const calculatedExpectedSaleValue = calculatedShareExpectedSaleValue(asset);
  const calculatedAnnualInterest = calculatedPropertyAnnualInterest(asset);

  function updatePropertyCostBase(patch: Partial<Asset>) {
    const nextAsset = { ...asset, ...patch };
    onChange({ ...patch, costBase: calculatedPropertyCostBase(nextAsset) });
  }

  function updateShareInputs(patch: Partial<Asset>) {
    const nextAsset = { ...asset, ...patch };
    const nextPatch = {
      ...patch,
      costBase: calculatedShareCostBase(nextAsset),
      currentValue: calculatedShareCurrentValue(nextAsset),
      valueAtPolicyStart: calculatedSharePolicyStartValue(nextAsset),
      plannedSalePrice: calculatedShareExpectedSaleValue(nextAsset),
    };
    updateScenarioAndAsset({ saleProceeds: nextPatch.plannedSalePrice }, nextPatch);
  }

  function updateKind(kind: AssetKind) {
    onChange({
      kind,
      isEligibleNewBuild: kind === "residential_property" ? asset.isEligibleNewBuild ?? false : false,
    });
  }

  function updateScenarioAndAsset(patch: Partial<SaleScenario>, assetPatch: Partial<Asset>) {
    onChange(assetPatch);
    onScenarioChange(patch);
  }

  return (
    <aside className="detailPane">
      <div className="detailPaneHeader">
        <div>
          <h2>Asset details</h2>
          <p>{assetKindLabel(asset.kind)}</p>
        </div>
        <span className="badge neutral">{asset.id === scenario.assetId ? "Active scenario" : "Selected"}</span>
      </div>

      <div className="detailForm">
        <label>
          Asset type
          <select value={asset.kind} onChange={(event) => updateKind(event.target.value as AssetKind)}>
            <option value="residential_property">Residential property</option>
            <option value="commercial_property">Commercial property</option>
            <option value="share_parcel">Share/ETF parcel</option>
          </select>
        </label>
        <label>
          Name
          <input value={asset.name} onChange={(event) => onChange({ name: event.target.value })} />
        </label>
        {isProperty && (
          <label className="span2">
            Address label
            <input value={asset.addressLabel ?? ""} onChange={(event) => onChange({ addressLabel: event.target.value })} />
          </label>
        )}
        <label>
          Acquisition / contract date
          <input type="date" value={asset.acquisitionDate} onChange={(event) => onChange({ acquisitionDate: event.target.value })} />
        </label>
        {isProperty && (
          <label>
            Settlement date
            <input type="date" value={asset.settlementDate ?? ""} onChange={(event) => onChange({ settlementDate: event.target.value })} />
          </label>
        )}
        <label>
          Ownership share
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={asset.ownershipShare}
            onChange={(event) => onChange({ ownershipShare: Number(event.target.value) })}
          />
        </label>
      </div>

      {isProperty ? (
        <div className="detailForm">
          <h3 className="formSectionTitle">Property cost base</h3>
          <label>
            Purchase price
            <MoneyInput value={asset.purchasePrice ?? 0} onChange={(purchasePrice) => updatePropertyCostBase({ purchasePrice })} />
          </label>
          <label>
            Stamp duty
            <MoneyInput value={asset.stampDuty ?? 0} onChange={(stampDuty) => updatePropertyCostBase({ stampDuty })} />
          </label>
          <label>
            Buying costs
            <MoneyInput value={asset.buyingCosts ?? 0} onChange={(buyingCosts) => updatePropertyCostBase({ buyingCosts })} />
          </label>
          <label>
            Capital improvements
            <MoneyInput value={asset.capitalImprovements ?? 0} onChange={(capitalImprovements) => updatePropertyCostBase({ capitalImprovements })} />
          </label>
          <label>
            Calculated cost base
            <CalculatedValue value={propertyCostBase} formula="Purchase + stamp duty + buying costs + improvements" />
          </label>
          <h3 className="formSectionTitle">Valuation and sale</h3>
          <label>
            Current value
            <MoneyInput value={asset.currentValue} onChange={(currentValue) => onChange({ currentValue })} />
          </label>
          <label>
            1 July 2027 value
            <MoneyInput value={asset.valueAtPolicyStart ?? 0} onChange={(valueAtPolicyStart) => onChange({ valueAtPolicyStart })} />
          </label>
          <label>
            Expected sale date
            <input
              type="date"
              value={scenario.saleDate}
              onChange={(event) => updateScenarioAndAsset({ saleDate: event.target.value }, { plannedSaleDate: event.target.value })}
            />
          </label>
          <label>
            Expected sale price
            <MoneyInput
              value={scenario.saleProceeds}
              onChange={(saleProceeds) => updateScenarioAndAsset({ saleProceeds }, { plannedSalePrice: saleProceeds })}
            />
          </label>
          <label>
            Selling costs
            <MoneyInput
              value={scenario.sellingCosts}
              onChange={(sellingCosts) => updateScenarioAndAsset({ sellingCosts }, { saleCostEstimate: sellingCosts })}
            />
          </label>
          <h3 className="formSectionTitle">Rental and loan</h3>
          <label>
            Loan balance
            <MoneyInput value={asset.loanBalance ?? 0} onChange={(loanBalance) => onChange({ loanBalance })} />
          </label>
          <label>
            Interest rate
            <PercentInput value={asset.interestRate ?? 0} onChange={(interestRate) => onChange({ interestRate })} />
          </label>
          <label>
            Calculated annual interest
            <CalculatedValue value={calculatedAnnualInterest} formula="Loan balance x interest rate" />
          </label>
          <label>
            Annual interest override
            <OptionalMoneyInput value={asset.annualInterest} onChange={(annualInterest) => onChange({ annualInterest })} />
          </label>
          <label>
            Annual rent
            <MoneyInput value={asset.annualRent ?? 0} onChange={(annualRent) => onChange({ annualRent })} />
          </label>
          <label>
            Deductible expenses
            <MoneyInput value={asset.annualDeductibleExpenses ?? 0} onChange={(annualDeductibleExpenses) => onChange({ annualDeductibleExpenses })} />
          </label>
          <label>
            Depreciation / capital works
            <MoneyInput value={asset.annualDepreciation ?? 0} onChange={(annualDepreciation) => onChange({ annualDepreciation })} />
          </label>
          {asset.kind === "residential_property" && (
            <label className="checkboxLabel">
              <input
                type="checkbox"
                checked={asset.isEligibleNewBuild ?? false}
                onChange={(event) => onChange({ isEligibleNewBuild: event.target.checked })}
              />
              Eligible new build
            </label>
          )}
        </div>
      ) : (
        <div className="detailForm">
          <h3 className="formSectionTitle">Parcel cost base</h3>
          <label>
            Units
            <NumberInput
              value={asset.units ?? 0}
              onChange={(units) => updateShareInputs({ units })}
            />
          </label>
          <label>
            Cost per unit
            <MoneyInput step={0.01} value={asset.costPerUnit ?? 0} onChange={(costPerUnit) => updateShareInputs({ costPerUnit })} />
          </label>
          <label>
            Brokerage
            <MoneyInput value={asset.brokerage ?? 0} onChange={(brokerage) => updateShareInputs({ brokerage })} />
          </label>
          <label>
            Cost-base adjustments
            <MoneyInput value={asset.costBaseAdjustments ?? 0} onChange={(costBaseAdjustments) => updateShareInputs({ costBaseAdjustments })} />
          </label>
          <label>
            Calculated cost base
            <CalculatedValue value={shareCostBase} formula="Units x cost per unit + brokerage + adjustments" />
          </label>
          <h3 className="formSectionTitle">Price and sale</h3>
          <label>
            Current unit price
            <MoneyInput
              step={0.01}
              value={asset.currentPrice ?? 0}
              onChange={(currentPrice) => updateShareInputs({ currentPrice })}
            />
          </label>
          <label>
            Current value
            <CalculatedValue value={calculatedCurrentValue} formula="Units x Current unit price" />
          </label>
          <label>
            1 July 2027 unit price
            <MoneyInput
              step={0.01}
              value={asset.priceAtPolicyStart ?? 0}
              onChange={(priceAtPolicyStart) => updateShareInputs({ priceAtPolicyStart })}
            />
          </label>
          <label>
            1 July 2027 value
            <CalculatedValue value={calculatedPolicyStartValue} formula="Units x 1 July 2027 unit price" />
          </label>
          <label>
            Expected sale date
            <input
              type="date"
              value={scenario.saleDate}
              onChange={(event) => updateScenarioAndAsset({ saleDate: event.target.value }, { plannedSaleDate: event.target.value })}
            />
          </label>
          <label>
            Expected sale unit price
            <MoneyInput
              step={0.01}
              value={asset.plannedSaleUnitPrice ?? 0}
              onChange={(plannedSaleUnitPrice) => updateShareInputs({ plannedSaleUnitPrice })}
            />
          </label>
          <label>
            Expected sale value
            <CalculatedValue value={calculatedExpectedSaleValue} formula="Units x Expected sale unit price" />
          </label>
          <label>
            Selling costs
            <MoneyInput
              value={scenario.sellingCosts}
              onChange={(sellingCosts) => updateScenarioAndAsset({ sellingCosts }, { saleCostEstimate: sellingCosts })}
            />
          </label>
        </div>
      )}
    </aside>
  );
}

function ScenarioScreen({
  asset,
  assets,
  profile,
  scenario,
  result,
  onProfileChange,
  onScenarioChange,
  onAssetChange,
}: {
  asset: Asset;
  assets: Asset[];
  profile: TaxProfile;
  scenario: SaleScenario;
  result: ReturnType<typeof compareAssetScenario>;
  onProfileChange: (patch: Partial<TaxProfile>) => void;
  onScenarioChange: (patch: Partial<SaleScenario>) => void;
  onAssetChange: (patch: Partial<Asset>) => void;
}) {
  const decisionOptions = useMemo(() => buildDecisionOptions(asset, scenario, profile), [asset, scenario, profile]);
  const nextMoves = useMemo(() => buildNextMoves(asset, result, decisionOptions), [asset, result, decisionOptions]);

  return (
    <div className="scenarioGrid">
      <BestNextMoves moves={nextMoves} />

      <section className="screenPanel">
        <div className="panelHeader">
          <h2>Inputs</h2>
        </div>
        <div className="formGrid">
          <label>
            Asset
            <select value={scenario.assetId} onChange={(event) => onScenarioChange({ assetId: event.target.value })}>
              {assets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input value={asset.name} onChange={(event) => onAssetChange({ name: event.target.value })} />
          </label>
          <label>
            Acquisition date
            <input type="date" value={asset.acquisitionDate} onChange={(event) => onAssetChange({ acquisitionDate: event.target.value })} />
          </label>
          <label>
            Cost base
            <CalculatedValue
              value={effectiveAssetForCalculation(asset).costBase}
              formula={asset.kind === "share_parcel" ? "Parcel cost components" : "Property cost components"}
            />
          </label>
          <label>
            Current value
            {asset.kind === "share_parcel" ? (
              <CalculatedValue value={calculatedShareCurrentValue(asset)} formula="Units x Current unit price" />
            ) : (
              <MoneyInput value={asset.currentValue} onChange={(currentValue) => onAssetChange({ currentValue })} />
            )}
          </label>
          <label>
            1 July 2027 value
            {asset.kind === "share_parcel" ? (
              <CalculatedValue value={calculatedSharePolicyStartValue(asset)} formula="Units x 1 July 2027 unit price" />
            ) : (
              <MoneyInput value={asset.valueAtPolicyStart ?? 0} onChange={(valueAtPolicyStart) => onAssetChange({ valueAtPolicyStart })} />
            )}
          </label>
          <label>
            Sale date
            <input type="date" value={scenario.saleDate} onChange={(event) => onScenarioChange({ saleDate: event.target.value })} />
          </label>
          <label>
            {asset.kind === "share_parcel" ? "Expected sale unit price" : "Expected sale price"}
            {asset.kind === "share_parcel" ? (
              <MoneyInput
                step={0.01}
                value={asset.plannedSaleUnitPrice ?? 0}
                onChange={(plannedSaleUnitPrice) => {
                  const saleProceeds = (asset.units ?? 0) * plannedSaleUnitPrice;
                  onAssetChange({ plannedSaleUnitPrice, plannedSalePrice: saleProceeds });
                  onScenarioChange({ saleProceeds });
                }}
              />
            ) : (
              <MoneyInput value={scenario.saleProceeds} onChange={(saleProceeds) => onScenarioChange({ saleProceeds })} />
            )}
          </label>
          {asset.kind === "share_parcel" && (
            <label>
              Expected sale value
              <CalculatedValue value={calculatedShareExpectedSaleValue(asset)} formula="Units x Expected sale unit price" />
            </label>
          )}
          <label>
            Selling costs
            <MoneyInput value={scenario.sellingCosts} onChange={(sellingCosts) => onScenarioChange({ sellingCosts })} />
          </label>
          <label>
            Ownership share
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={asset.ownershipShare}
              onChange={(event) => onAssetChange({ ownershipShare: Number(event.target.value) })}
            />
          </label>
          <label>
            Non-CGT taxable income
            <MoneyInput
              value={profile.nonCgtTaxableIncome}
              onChange={(nonCgtTaxableIncome) => onProfileChange({ nonCgtTaxableIncome })}
            />
          </label>
          <label>
            Carried-forward losses
            <MoneyInput
              value={profile.carriedForwardCapitalLosses}
              onChange={(carriedForwardCapitalLosses) => onProfileChange({ carriedForwardCapitalLosses })}
            />
          </label>
          <label>
            CPI at acquisition
            <NumberInput value={scenario.cpiAtAcquisition} onChange={(cpiAtAcquisition) => onScenarioChange({ cpiAtAcquisition })} />
          </label>
          <label>
            CPI at 1 July 2027
            <NumberInput value={scenario.cpiAtPolicyStart} onChange={(cpiAtPolicyStart) => onScenarioChange({ cpiAtPolicyStart })} />
          </label>
          <label>
            CPI at sale
            <NumberInput value={scenario.cpiAtSale} onChange={(cpiAtSale) => onScenarioChange({ cpiAtSale })} />
          </label>
          {asset.kind === "residential_property" && (
            <>
              <label>
                Annual rent
                <MoneyInput value={asset.annualRent ?? 0} onChange={(annualRent) => onAssetChange({ annualRent })} />
              </label>
              <label>
                Loan balance
                <MoneyInput value={asset.loanBalance ?? 0} onChange={(loanBalance) => onAssetChange({ loanBalance })} />
              </label>
              <label>
                Interest rate
                <PercentInput value={asset.interestRate ?? 0} onChange={(interestRate) => onAssetChange({ interestRate })} />
              </label>
              <label>
                Calculated annual interest
                <CalculatedValue value={calculatedPropertyAnnualInterest(asset)} formula="Loan balance x interest rate" />
              </label>
              <label>
                Annual interest override
                <OptionalMoneyInput value={asset.annualInterest} onChange={(annualInterest) => onAssetChange({ annualInterest })} />
              </label>
              <label>
                Deductible expenses
                <MoneyInput
                  value={asset.annualDeductibleExpenses ?? 0}
                  onChange={(annualDeductibleExpenses) => onAssetChange({ annualDeductibleExpenses })}
                />
              </label>
              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={asset.isEligibleNewBuild ?? false}
                  onChange={(event) => onAssetChange({ isEligibleNewBuild: event.target.checked })}
                />
                Eligible new build
              </label>
            </>
          )}
          <label className="checkboxLabel">
            <input
              type="checkbox"
              checked={profile.receivesIncomeSupport}
              onChange={(event) => onProfileChange({ receivesIncomeSupport: event.target.checked })}
            />
            Income-support minimum-tax exemption
          </label>
        </div>
      </section>

      <section className="screenPanel">
        <div className="panelHeader">
          <h2>Current vs reform</h2>
          <Delta value={result.taxDelta} />
        </div>
        <div className="metricsGrid">
          <Metric label="Current taxable gain" value={money(result.current.taxableGain)} />
          <Metric label="Reform taxable gain" value={money(result.reform.taxableGain)} />
          <Metric label="Current tax on gain" value={money(result.current.totalTax)} />
          <Metric label="Reform tax on gain" value={money(result.reform.totalTax)} />
          <Metric label="Minimum-tax top-up" value={money(result.reform.minimumTaxTopUp)} />
          <Metric label="After-tax proceeds delta" value={money(result.proceedsDelta)} intent={result.proceedsDelta >= 0 ? "good" : "bad"} />
        </div>
        <div className="waterfall">
          <div>
            <span>Net proceeds</span>
            <strong>{money(result.reform.netProceeds)}</strong>
          </div>
          <div>
            <span>Pre-2027 taxable gain</span>
            <strong>{money(result.reform.prePolicyTaxableGain ?? 0)}</strong>
          </div>
          <div>
            <span>Post-2027 real gain</span>
            <strong>{money(result.reform.postPolicyRealGain ?? result.reform.taxableGain)}</strong>
          </div>
          <div>
            <span>Ordinary marginal tax</span>
            <strong>{money(result.reform.ordinaryTax)}</strong>
          </div>
          <div>
            <span>30% minimum top-up</span>
            <strong>{money(result.reform.minimumTaxTopUp)}</strong>
          </div>
        </div>
      </section>

      <aside className="screenPanel inspector">
        <div className="panelHeader">
          <h2>Explanation</h2>
        </div>
        <p className="callout">{result.reform.method}</p>
        {result.reform.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
        <hr />
        <p className="callout">{result.negativeGearing.status.replaceAll("_", " ")}</p>
        <p>{result.negativeGearing.explanation}</p>
        <dl>
          <dt>Net rental result</dt>
          <dd>{money(result.negativeGearing.netRentalResult)}</dd>
          <dt>Quarantined loss</dt>
          <dd>{money(result.negativeGearing.quarantinedLoss)}</dd>
        </dl>
      </aside>
    </div>
  );
}

function CompareScreen({ asset, scenario, profile }: { asset: Asset; scenario: SaleScenario; profile: TaxProfile }) {
  const options = useMemo(() => buildDecisionOptions(asset, scenario, profile), [asset, scenario, profile]);
  const currentResult = useMemo(
    () => compareAssetScenario(effectiveAssetForCalculation(asset), scenario, profile),
    [asset, scenario, profile],
  );
  const nextMoves = useMemo(() => buildNextMoves(asset, currentResult, options), [asset, currentResult, options]);
  const fullSaleOptions = options.filter((option) => option.group === "full-sale");
  const stagedShareOptions = options.filter((option) => option.group === "staged-share");
  const baseOption = fullSaleOptions.find((option) => option.id === "base-fy2028") ?? fullSaleOptions[0];

  return (
    <div className="compareStack">
      <BestNextMoves moves={nextMoves} />

      <section className="screenPanel">
        <div className="panelHeader">
          <div>
            <h2>Scenario comparison</h2>
            <p>{asset.name}: ranked by what is most likely to improve your after-tax position.</p>
          </div>
        </div>

        <div className="decisionSummary">
          <Metric
            label="Current selection"
            value={plainDelta(currentResult.proceedsDelta)}
            intent={currentResult.proceedsDelta >= 0 ? "good" : "bad"}
          />
          <Metric label="Best full-sale option" value={bestOptionLabel(fullSaleOptions)} intent="good" />
          <Metric label="Minimum-tax risk" value={minimumTaxRiskLabel(options)} />
        </div>

        <OptionTable options={fullSaleOptions} baseOption={baseOption} />
        <ComparisonBars options={fullSaleOptions} baseOption={baseOption} />
      </section>

      {stagedShareOptions.length > 0 && (
        <section className="screenPanel">
          <div className="panelHeader">
            <div>
              <h2>Sell in stages</h2>
              <p>Planning estimates for selling part of the share parcel instead of all of it at once.</p>
            </div>
          </div>
          <OptionTable options={stagedShareOptions} />
        </section>
      )}
    </div>
  );
}

function BestNextMoves({ moves }: { moves: NextMove[] }) {
  return (
    <section className="screenPanel bestNextMoves">
      <div className="panelHeader">
        <div>
          <h2>Best next moves</h2>
          <p>Plain-English options worth testing before making a sale decision.</p>
        </div>
      </div>
      <div className="nextMoveList">
        {moves.map((move) => (
          <article className={`nextMove ${move.intent ?? ""}`} key={move.title}>
            <div className="moveIcon">
              {move.intent === "good" ? <CheckCircle2 aria-hidden="true" size={18} /> : <Lightbulb aria-hidden="true" size={18} />}
            </div>
            <div>
              <h3>{move.title}</h3>
              <p>{move.detail}</p>
              <strong>{move.impact}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OptionTable({ options, baseOption }: { options: DecisionOption[]; baseOption?: DecisionOption }) {
  const displayedOptions = baseOption ? rankOptions(options) : options;

  return (
    <div className="optionTableWrap">
      <table className="optionTable">
        <thead>
          <tr>
            <th>Option</th>
            <th>What changes</th>
            <th>Portion</th>
            <th>You keep</th>
            <th>{baseOption ? "Difference vs base" : "Reform impact"}</th>
            <th>Tax paid</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          {displayedOptions.map((option, index) => {
            const baselineDelta = baseOption
              ? option.outcome.reformAfterTaxProceeds - baseOption.outcome.reformAfterTaxProceeds
              : option.outcome.proceedsDelta;
            return (
              <tr key={option.id}>
                <td>
                  <strong>{option.label}</strong>
                  <div className="muted">{option.saleDateLabel}</div>
                  {baseOption && index === 0 && <span className="badge good">Best in this group</span>}
                </td>
                <td>{option.changed}</td>
                <td>{option.portionLabel}</td>
                <td>{money(option.outcome.reformAfterTaxProceeds)}</td>
                <td>
                  <Delta value={baselineDelta} mode="cash" />
                </td>
                <td>{money(option.outcome.reformTax)}</td>
                <td>{option.takeaway}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ComparisonBars({ options, baseOption }: { options: DecisionOption[]; baseOption?: DecisionOption }) {
  if (options.length === 0) {
    return null;
  }

  const ranked = rankOptions(options);
  const maxAbsDelta = Math.max(
    1,
    ...ranked.map((option) =>
      Math.abs(option.outcome.reformAfterTaxProceeds - (baseOption?.outcome.reformAfterTaxProceeds ?? 0)),
    ),
  );

  return (
    <div className="comparisonBars" aria-label="Scenario difference chart">
      {ranked.map((option) => {
        const value = option.outcome.reformAfterTaxProceeds - (baseOption?.outcome.reformAfterTaxProceeds ?? 0);
        const width = Math.max(3, Math.round((Math.abs(value) / maxAbsDelta) * 100));
        return (
          <div className="barRow" key={option.id}>
            <span>{option.label}</span>
            <div className="barTrack">
              <div className={value >= 0 ? "barFill good" : "barFill bad"} style={{ width: `${width}%` }} />
            </div>
            <strong>{plainDelta(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function buildDecisionOptions(asset: Asset, scenario: SaleScenario, profile: TaxProfile): DecisionOption[] {
  const effectiveAsset = effectiveAssetForCalculation(asset);
  const fullSaleOptions = scenarioPresets.map((preset) => {
    const nextScenario = { ...scenario, saleDate: preset.saleDate, cpiAtSale: preset.cpiAtSale };
    const nextProfile = { ...profile, nonCgtTaxableIncome: preset.income };
    const result = compareAssetScenario(effectiveAsset, nextScenario, nextProfile);

    return {
      id: preset.id,
      label: preset.label,
      group: "full-sale" as const,
      changed: preset.changed,
      takeaway: scenarioTakeaway(result.proceedsDelta, result.reform.minimumTaxTopUp),
      saleDateLabel: shortDate(preset.saleDate),
      incomeLabel: money(preset.income),
      portionLabel: "All planned sale",
      outcome: outcomeFromComparison(result),
    };
  });

  if (asset.kind !== "share_parcel") {
    return fullSaleOptions;
  }

  return [...fullSaleOptions, ...buildStagedShareOptions(asset, scenario, profile)];
}

function buildStagedShareOptions(asset: Asset, scenario: SaleScenario, profile: TaxProfile): DecisionOption[] {
  const saleDate = scenario.saleDate;
  const laterSaleDate = addYears(saleDate, 1);
  const laterScenario = { ...scenario, saleDate: laterSaleDate, cpiAtSale: scenario.cpiAtSale + 6 };
  const oneQuarter = compareSinglePartialShareSale(asset, scenario, profile, 0.25);
  const half = compareSinglePartialShareSale(asset, scenario, profile, 0.5);
  const stagedHalf = compareShareStagePlan(
    asset,
    [
      { fraction: 0.5, scenario },
      { fraction: 0.5, scenario: laterScenario },
    ],
    profile,
  );

  return [
    {
      id: "share-25-now",
      label: "Sell 25% now",
      group: "staged-share",
      changed: "Only a quarter of the parcel is sold.",
      takeaway: "Raises less cash now, but keeps most of the holding invested.",
      saleDateLabel: shortDate(saleDate),
      incomeLabel: money(profile.nonCgtTaxableIncome),
      portionLabel: "25%",
      outcome: oneQuarter,
    },
    {
      id: "share-50-now",
      label: "Sell 50% now",
      group: "staged-share",
      changed: "Half the parcel is sold in the selected tax year.",
      takeaway: "A middle path: some cash now, less tax event than selling all units.",
      saleDateLabel: shortDate(saleDate),
      incomeLabel: money(profile.nonCgtTaxableIncome),
      portionLabel: "50%",
      outcome: half,
    },
    {
      id: "share-50-50",
      label: "Sell 50% + 50%",
      group: "staged-share",
      changed: "Half sells now and half sells one year later with CPI lifted by 6 points.",
      takeaway: "Spreads the tax event across two years; final result depends on future price and income.",
      saleDateLabel: `${shortDate(saleDate)} and ${shortDate(laterSaleDate)}`,
      incomeLabel: money(profile.nonCgtTaxableIncome),
      portionLabel: "100% over 2 years",
      outcome: stagedHalf,
    },
  ];
}

function compareSinglePartialShareSale(
  asset: Asset,
  scenario: SaleScenario,
  profile: TaxProfile,
  fraction: number,
): ScenarioOutcome {
  return outcomeFromComparison(compareAssetScenario(scaleAssetForSale(asset, fraction), scaleScenarioForSale(scenario, fraction), profile));
}

function compareShareStagePlan(
  asset: Asset,
  stages: { fraction: number; scenario: SaleScenario }[],
  profile: TaxProfile,
): ScenarioOutcome {
  let currentLosses = profile.carriedForwardCapitalLosses;
  let reformLosses = profile.carriedForwardCapitalLosses;
  let currentTax = 0;
  let reformTax = 0;
  let currentAfterTaxProceeds = 0;
  let reformAfterTaxProceeds = 0;
  let minimumTaxTopUp = 0;
  let taxableGain = 0;

  for (const stage of stages) {
    const stageAsset = scaleAssetForSale(asset, stage.fraction);
    const stageScenario = scaleScenarioForSale(stage.scenario, stage.fraction);
    const current = calculateCurrentCgt(stageAsset, stageScenario, { ...profile, carriedForwardCapitalLosses: currentLosses });
    const reform = calculateReformCgt(stageAsset, stageScenario, { ...profile, carriedForwardCapitalLosses: reformLosses });

    currentLosses = Math.max(0, currentLosses - current.capitalLossesApplied);
    reformLosses = Math.max(0, reformLosses - reform.capitalLossesApplied);
    currentTax += current.totalTax;
    reformTax += reform.totalTax;
    currentAfterTaxProceeds += current.afterTaxProceeds;
    reformAfterTaxProceeds += reform.afterTaxProceeds;
    minimumTaxTopUp += reform.minimumTaxTopUp;
    taxableGain += reform.taxableGain;
  }

  return {
    currentTax,
    reformTax,
    taxDelta: reformTax - currentTax,
    proceedsDelta: reformAfterTaxProceeds - currentAfterTaxProceeds,
    currentAfterTaxProceeds,
    reformAfterTaxProceeds,
    minimumTaxTopUp,
    taxableGain,
  };
}

function scaleAssetForSale(asset: Asset, fraction: number): Asset {
  const scaled = {
    ...asset,
    units: asset.units === undefined ? undefined : asset.units * fraction,
    brokerage: asset.brokerage === undefined ? undefined : asset.brokerage * fraction,
    costBaseAdjustments: asset.costBaseAdjustments === undefined ? undefined : asset.costBaseAdjustments * fraction,
    costBase: asset.costBase * fraction,
    currentValue: asset.currentValue * fraction,
    valueAtPolicyStart: asset.valueAtPolicyStart === undefined ? undefined : asset.valueAtPolicyStart * fraction,
    plannedSalePrice: asset.plannedSalePrice === undefined ? undefined : asset.plannedSalePrice * fraction,
  };

  return effectiveAssetForCalculation(scaled);
}

function scaleScenarioForSale(scenario: SaleScenario, fraction: number): SaleScenario {
  return {
    ...scenario,
    saleProceeds: scenario.saleProceeds * fraction,
    sellingCosts: scenario.sellingCosts * fraction,
  };
}

function outcomeFromComparison(result: ReturnType<typeof compareAssetScenario>): ScenarioOutcome {
  return {
    currentTax: result.current.totalTax,
    reformTax: result.reform.totalTax,
    taxDelta: result.taxDelta,
    proceedsDelta: result.proceedsDelta,
    currentAfterTaxProceeds: result.current.afterTaxProceeds,
    reformAfterTaxProceeds: result.reform.afterTaxProceeds,
    minimumTaxTopUp: result.reform.minimumTaxTopUp,
    taxableGain: result.reform.taxableGain,
  };
}

function buildNextMoves(
  asset: Asset,
  currentResult: ReturnType<typeof compareAssetScenario>,
  options: DecisionOption[],
): NextMove[] {
  const fullSaleOptions = options.filter((option) => option.group === "full-sale");
  const stagedShareOptions = options.filter((option) => option.group === "staged-share");
  const baseOption = fullSaleOptions.find((option) => option.id === "base-fy2028") ?? fullSaleOptions[0];
  const bestFullSale = rankOptions(fullSaleOptions)[0];
  const moves: NextMove[] = [];

  if (bestFullSale && baseOption) {
    const uplift = bestFullSale.outcome.reformAfterTaxProceeds - baseOption.outcome.reformAfterTaxProceeds;
    moves.push({
      title: uplift > 0 ? `Test ${bestFullSale.label.toLowerCase()}` : "Keep the current sale timing as your baseline",
      detail:
        uplift > 0
          ? `${bestFullSale.changed} This is the strongest full-sale option in the current assumptions.`
          : "The current post-reform timing is already close to the best full-sale option in this set.",
      impact: uplift > 0 ? `${plainDelta(uplift)} versus the base post-reform sale.` : "No better full-sale option found here.",
      intent: uplift > 0 ? "good" : undefined,
    });
  }

  if (asset.kind === "share_parcel" && stagedShareOptions.length > 0) {
    const stagedHalf = stagedShareOptions.find((option) => option.id === "share-50-50");
    moves.push({
      title: "Compare selling shares in stages",
      detail:
        "Selling part of a parcel can reduce the size of one tax event and leave some units invested for a later year.",
      impact: stagedHalf
        ? `${money(stagedHalf.outcome.reformTax)} estimated reform tax if sold as a 50% + 50% plan.`
        : "Use the staged-sale rows to compare partial-sale cash and tax.",
      intent: "good",
    });
  }

  if (currentResult.reform.minimumTaxTopUp > 0) {
    moves.push({
      title: "Reduce minimum-tax exposure",
      detail:
        "The model shows a 30% minimum-tax top-up, so timing, income year, and asset split can materially change the result.",
      impact: `${money(currentResult.reform.minimumTaxTopUp)} top-up in the current scenario.`,
      intent: "bad",
    });
  } else {
    moves.push({
      title: "Minimum tax is not the main issue",
      detail: "In the current scenario, ordinary tax is high enough that no reform minimum-tax top-up appears.",
      impact: "Focus on sale timing, income year, and valuation accuracy first.",
    });
  }

  if (asset.acquisitionDate < "2027-07-01") {
    moves.push({
      title: "Get the 1 July 2027 value right",
      detail:
        "For assets already owned before reform, this value controls how much gain is treated under the old rules versus the new indexation rules.",
      impact: `${money(currentResult.reform.prePolicyTaxableGain ?? 0)} taxable gain is currently treated as pre-reform.`,
    });
  }

  if (asset.kind === "residential_property" && currentResult.negativeGearing.quarantinedLoss > 0) {
    moves.push({
      title: "Model the rental cash-flow hit",
      detail: "A quarantined rental loss means the loss may not reduce your salary or other income tax immediately.",
      impact: `${money(currentResult.negativeGearing.quarantinedLoss)} estimated quarantined loss.`,
      intent: "bad",
    });
  }

  return moves.slice(0, 4);
}

function rankOptions(options: DecisionOption[]): DecisionOption[] {
  return [...options].sort((a, b) => b.outcome.reformAfterTaxProceeds - a.outcome.reformAfterTaxProceeds);
}

function bestOptionLabel(options: DecisionOption[]): string {
  return rankOptions(options)[0]?.label ?? "Not available";
}

function minimumTaxRiskLabel(options: DecisionOption[]): string {
  const maxTopUp = Math.max(0, ...options.map((option) => option.outcome.minimumTaxTopUp));
  return maxTopUp > 0 ? `${money(maxTopUp)} possible top-up` : "No top-up shown";
}

function scenarioTakeaway(proceedsDelta: number, minimumTaxTopUp: number): string {
  if (minimumTaxTopUp > 0) {
    return "Watch the minimum-tax top-up; this option may be worse than it first looks.";
  }
  if (proceedsDelta > 0) {
    return `Reform leaves you with ${money(proceedsDelta)} more than current rules.`;
  }
  if (proceedsDelta < 0) {
    return `Reform leaves you with ${money(Math.abs(proceedsDelta))} less than current rules.`;
  }
  return "No material difference between current rules and reform.";
}

function plainDelta(value: number): string {
  if (Math.abs(value) < 1) {
    return "No change";
  }

  return value > 0 ? `${money(value)} more` : `${money(Math.abs(value))} less`;
}

function addYears(date: string, years: number): string {
  const next = new Date(`${date}T00:00:00`);
  next.setFullYear(next.getFullYear() + years);
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${month}-${day}`;
}

function AssumptionsScreen({
  profile,
  onProfileChange,
}: {
  profile: TaxProfile;
  onProfileChange: (patch: Partial<TaxProfile>) => void;
}) {
  return (
    <section className="screenPanel twoColumn">
      <div>
        <div className="panelHeader">
          <h2>Tax profile</h2>
        </div>
        <div className="formGrid compact">
          <label>
            Residency
            <select value={profile.residency} onChange={(event) => onProfileChange({ residency: event.target.value as TaxProfile["residency"] })}>
              <option value="australian_resident">Australian resident</option>
              <option value="foreign_resident">Foreign resident (not modelled)</option>
            </select>
          </label>
          <label>
            Ownership entity
            <select
              value={profile.ownershipEntity}
              onChange={(event) => onProfileChange({ ownershipEntity: event.target.value as TaxProfile["ownershipEntity"] })}
            >
              <option value="individual">Individual</option>
              <option value="joint_individuals">Joint individuals (not modelled)</option>
              <option value="trust">Trust (later)</option>
              <option value="company">Company (later)</option>
              <option value="smsf">SMSF (later)</option>
            </select>
          </label>
        </div>
      </div>
      <div>
        <div className="panelHeader">
          <h2>Calculation assumptions</h2>
        </div>
        <ul className="assumptionList">
          {appAssumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SourcesScreen() {
  return (
    <section className="screenPanel">
      <div className="panelHeader">
        <div>
          <h2>Sources and unresolved details</h2>
          <p>Last researched in repo docs: 24 May 2026.</p>
        </div>
      </div>
      <div className="sourceList">
        {policySources.map((source) => (
          <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
            <strong>{source.label}</strong>
            <span>{source.note}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function ExposureBadges({ asset, result }: { asset: Asset; result: ReturnType<typeof compareAssetScenario> }) {
  const badges = [];
  if (asset.kind === "residential_property" && asset.acquisitionDate <= "2026-05-12") {
    badges.push("Grandfathered property");
  }
  if (asset.acquisitionDate < "2027-07-01") {
    badges.push("Post-2027 split");
  }
  if (asset.isEligibleNewBuild) {
    badges.push("New build choice");
  }
  if (result.reform.minimumTaxTopUp > 0) {
    badges.push("Minimum-tax risk");
  }
  if (!asset.valueAtPolicyStart && asset.acquisitionDate < "2027-07-01") {
    badges.push("Needs 1 July value");
  }

  return (
    <div className="badgeStack">
      {(badges.length ? badges : ["Low exposure"]).map((badge) => (
        <span className="badge" key={badge}>
          {badge}
        </span>
      ))}
    </div>
  );
}

function Metric({ label, value, intent }: { label: string; value: string; intent?: "good" | "bad" }) {
  return (
    <div className={`metric ${intent ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Delta({ value, mode = "tax" }: { value: number; mode?: "tax" | "cash" }) {
  const isGood = mode === "tax" ? value < 0 : value > 0;
  const isBad = mode === "tax" ? value > 0 : value < 0;
  const intent = isBad ? "bad" : isGood ? "good" : "neutral";
  const label =
    mode === "cash"
      ? plainDelta(value)
      : value === 0
        ? "No tax change"
        : value > 0
          ? `${money(value)} extra tax`
          : `${money(Math.abs(value))} tax saving`;
  return <span className={`delta ${intent}`}>{label}</span>;
}

function MoneyInput({ value, onChange, step = 1000 }: { value: number; onChange: (value: number) => void; step?: number }) {
  return <input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />;
}

function OptionalMoneyInput({
  value,
  onChange,
  step = 1000,
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      min="0"
      step={step}
      placeholder="Use calculated value"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
    />
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} />;
}

function PercentInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min="0"
      max="100"
      step="0.1"
      value={Math.round(value * 1000) / 10}
      onChange={(event) => onChange(Number(event.target.value) / 100)}
    />
  );
}

function CalculatedValue({ value, formula }: { value: number; formula: string }) {
  return (
    <div className="calculatedValue">
      <strong>{money(value)}</strong>
      <span>{formula}</span>
    </div>
  );
}

function calculatedShareCurrentValue(asset: Asset): number {
  if (asset.units === undefined || asset.currentPrice === undefined) {
    return asset.currentValue;
  }

  return asset.units * asset.currentPrice;
}

function calculatedSharePolicyStartValue(asset: Asset): number {
  if (asset.units === undefined || asset.priceAtPolicyStart === undefined) {
    return asset.valueAtPolicyStart ?? 0;
  }

  return asset.units * asset.priceAtPolicyStart;
}

function calculatedShareExpectedSaleValue(asset: Asset): number {
  if (asset.units === undefined || asset.plannedSaleUnitPrice === undefined) {
    return asset.plannedSalePrice ?? 0;
  }

  return asset.units * asset.plannedSaleUnitPrice;
}

function plannedSaleTotal(asset?: Asset): number | undefined {
  if (!asset) {
    return undefined;
  }

  if (asset.kind === "share_parcel" && asset.plannedSaleUnitPrice !== undefined) {
    return calculatedShareExpectedSaleValue(asset);
  }

  return asset.plannedSalePrice;
}

function calculatedShareCostBase(asset: Asset): number {
  if (asset.units === undefined || asset.costPerUnit === undefined) {
    return asset.costBase;
  }

  return asset.units * asset.costPerUnit + (asset.brokerage ?? 0) + (asset.costBaseAdjustments ?? 0);
}

function calculatedPropertyCostBase(asset: Asset): number {
  if (
    asset.purchasePrice === undefined &&
    asset.stampDuty === undefined &&
    asset.buyingCosts === undefined &&
    asset.capitalImprovements === undefined
  ) {
    return asset.costBase;
  }

  return (asset.purchasePrice ?? 0) + (asset.stampDuty ?? 0) + (asset.buyingCosts ?? 0) + (asset.capitalImprovements ?? 0);
}

function calculatedPropertyAnnualInterest(asset: Asset): number {
  return (asset.loanBalance ?? 0) * (asset.interestRate ?? 0);
}

function effectiveAssetForCalculation(asset: Asset): Asset {
  if (asset.kind === "share_parcel") {
    return {
      ...asset,
      costBase: calculatedShareCostBase(asset),
      currentValue: calculatedShareCurrentValue(asset),
      valueAtPolicyStart: calculatedSharePolicyStartValue(asset),
      plannedSalePrice: calculatedShareExpectedSaleValue(asset),
    };
  }

  if (asset.kind === "residential_property" || asset.kind === "commercial_property") {
    return {
      ...asset,
      costBase: calculatedPropertyCostBase(asset),
    };
  }

  return asset;
}
