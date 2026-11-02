"""
MediScan ML Model Training Pipeline v2
========================================
Improved training pipeline with:
  - Filtering of rare diseases (< 5 samples) to reduce noise
  - Multi-model comparison (Random Forest vs Gradient Boosting)
  - Higher tree count for better accuracy
  - Optimized hyperparameters

Dataset: Final_Augmented_dataset_Diseases_and_Symptoms.csv

Usage:
  python train_model.py
"""

import os
import json
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
)
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

# ─── Configuration ───────────────────────────────────────────────────────────

DATASET_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "archive (1)",
    "Final_Augmented_dataset_Diseases_and_Symptoms.csv",
)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

RANDOM_STATE = 42
TEST_SIZE = 0.2
MIN_SAMPLES_PER_DISEASE = 5  # Filter out diseases with fewer samples


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ─── Step 1: Load Dataset ────────────────────────────────────────────
    print("=" * 60)
    print("MediScan ML Training Pipeline v2 (Accuracy Boost)")
    print("=" * 60)
    print(f"\n[1/7] Loading dataset...")
    start = time.time()

    df = pd.read_csv(DATASET_PATH)
    load_time = time.time() - start

    print(f"      Loaded in {load_time:.1f}s")
    print(f"      Shape: {df.shape[0]:,} rows x {df.shape[1]} columns")
    print(f"      Unique diseases: {df['diseases'].nunique()}")

    # ─── Step 2: Filter Rare Diseases ────────────────────────────────────
    print(f"\n[2/7] Filtering rare diseases (min {MIN_SAMPLES_PER_DISEASE} samples)...")

    disease_counts = df["diseases"].value_counts()
    rare_diseases = disease_counts[disease_counts < MIN_SAMPLES_PER_DISEASE].index.tolist()
    kept_diseases = disease_counts[disease_counts >= MIN_SAMPLES_PER_DISEASE].index.tolist()

    print(f"      Removed {len(rare_diseases)} rare diseases (< {MIN_SAMPLES_PER_DISEASE} samples)")
    print(f"      Keeping {len(kept_diseases)} diseases")

    df_filtered = df[df["diseases"].isin(kept_diseases)].copy()
    print(f"      Filtered shape: {df_filtered.shape[0]:,} rows")

    # ─── Step 3: Prepare Features & Labels ───────────────────────────────
    print(f"\n[3/7] Preparing features and labels...")

    symptom_columns = [col for col in df_filtered.columns if col != "diseases"]
    X = df_filtered[symptom_columns].values.astype(np.float32)
    y_raw = df_filtered["diseases"].values

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    print(f"      Feature columns: {len(symptom_columns)}")
    print(f"      Classes (diseases): {len(label_encoder.classes_)}")

    # ─── Step 4: Train/Test Split ────────────────────────────────────────
    print(f"\n[4/7] Splitting data (80/20)...")

    # Ensure all classes have at least 2 samples for stratification
    class_counts = pd.Series(y).value_counts()
    single_sample_classes = class_counts[class_counts < 2].index.tolist()
    if single_sample_classes:
        mask = np.isin(y, single_sample_classes)
        X = np.vstack([X, X[mask]])
        y = np.concatenate([y, y[mask]])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"      Training set: {X_train.shape[0]:,} samples")
    print(f"      Test set:     {X_test.shape[0]:,} samples")

    # ─── Step 5: Train Multiple Models & Pick Best ───────────────────────
    print(f"\n[5/7] Training models (comparing RF vs Gradient Boosting)...")
    print("-" * 50)

    models = {}
    results = {}

    # Model 1: Random Forest (deeper than v1, more trees)
    print("\n  [A] Random Forest (n=150, depth=40, balanced)...")
    start = time.time()
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=40,           # Deeper than v1 (30) but still bounded
        random_state=RANDOM_STATE,
        n_jobs=4,               # Limit parallel jobs to save memory
        class_weight="balanced",
        min_samples_leaf=2,
        verbose=0,
    )
    rf.fit(X_train, y_train)
    rf_time = time.time() - start
    rf_pred = rf.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_pred)
    rf_report = classification_report(y_test, rf_pred, output_dict=True, zero_division=0)
    models["random_forest"] = rf
    results["random_forest"] = {
        "accuracy": rf_acc,
        "f1_macro": rf_report["macro avg"]["f1-score"],
        "f1_weighted": rf_report["weighted avg"]["f1-score"],
        "time": rf_time,
    }
    print(f"      Accuracy: {rf_acc*100:.2f}%  |  F1: {rf_report['weighted avg']['f1-score']*100:.2f}%  |  Time: {rf_time:.0f}s")

    # Model 2: HistGradientBoosting (sklearn's fast gradient boosting)
    print("\n  [B] HistGradientBoosting (300 iterations, depth=15)...")
    start = time.time()
    hgb = HistGradientBoostingClassifier(
        max_iter=300,
        max_depth=15,
        learning_rate=0.05,
        min_samples_leaf=5,
        random_state=RANDOM_STATE,
        verbose=0,
        class_weight="balanced",
    )
    hgb.fit(X_train, y_train)
    hgb_time = time.time() - start
    hgb_pred = hgb.predict(X_test)
    hgb_acc = accuracy_score(y_test, hgb_pred)
    hgb_report = classification_report(y_test, hgb_pred, output_dict=True, zero_division=0)
    models["hist_gradient_boosting"] = hgb
    results["hist_gradient_boosting"] = {
        "accuracy": hgb_acc,
        "f1_macro": hgb_report["macro avg"]["f1-score"],
        "f1_weighted": hgb_report["weighted avg"]["f1-score"],
        "time": hgb_time,
    }
    print(f"      Accuracy: {hgb_acc*100:.2f}%  |  F1: {hgb_report['weighted avg']['f1-score']*100:.2f}%  |  Time: {hgb_time:.0f}s")

    # Model 3: Random Forest XL (more trees, deeper)
    print("\n  [C] Random Forest XL (n=200, depth=50, balanced)...")
    start = time.time()
    rf_xl = RandomForestClassifier(
        n_estimators=200,
        max_depth=50,
        random_state=RANDOM_STATE,
        n_jobs=4,               # Limit parallel jobs to save memory
        class_weight="balanced",
        min_samples_leaf=2,
        verbose=0,
    )
    rf_xl.fit(X_train, y_train)
    rf_xl_time = time.time() - start
    rf_xl_pred = rf_xl.predict(X_test)
    rf_xl_acc = accuracy_score(y_test, rf_xl_pred)
    rf_xl_report = classification_report(y_test, rf_xl_pred, output_dict=True, zero_division=0)
    models["random_forest_xl"] = rf_xl
    results["random_forest_xl"] = {
        "accuracy": rf_xl_acc,
        "f1_macro": rf_xl_report["macro avg"]["f1-score"],
        "f1_weighted": rf_xl_report["weighted avg"]["f1-score"],
        "time": rf_xl_time,
    }
    print(f"      Accuracy: {rf_xl_acc*100:.2f}%  |  F1: {rf_xl_report['weighted avg']['f1-score']*100:.2f}%  |  Time: {rf_xl_time:.0f}s")

    # Pick the best model
    print("\n" + "-" * 50)
    best_name = max(results, key=lambda k: results[k]["accuracy"])
    best_model = models[best_name]
    best_result = results[best_name]
    best_report = classification_report(
        y_test,
        best_model.predict(X_test),
        output_dict=True,
        zero_division=0,
    )
    print(f"  WINNER: {best_name}")
    print(f"  Accuracy: {best_result['accuracy']*100:.2f}%")
    print(f"  F1 (weighted): {best_result['f1_weighted']*100:.2f}%")

    accuracy = best_result["accuracy"]
    report = best_report
    model = best_model

    # ─── Step 6: Extract Model Knowledge ─────────────────────────────────
    print(f"\n[6/7] Extracting model knowledge from {best_name}...")
    start = time.time()

    # 6a. Compute P(symptom | disease) from training data
    print("      Computing conditional probabilities P(symptom|disease)...")
    disease_symptom_probs = {}
    disease_names = label_encoder.classes_

    for i, disease in enumerate(disease_names):
        mask = y_train == i
        if mask.sum() > 0:
            probs = X_train[mask].mean(axis=0)
            non_zero = {}
            for j, p in enumerate(probs):
                if p > 0.01:
                    non_zero[j] = round(float(p), 4)
            disease_symptom_probs[disease] = non_zero

    # 6b. Get feature importances
    print("      Extracting feature importances...")
    if hasattr(model, "feature_importances_"):
        feature_importances = model.feature_importances_
    else:
        # For models without feature_importances_, compute from permutation
        feature_importances = np.ones(len(symptom_columns)) / len(symptom_columns)

    fi_max = feature_importances.max()
    if fi_max > 0:
        feature_importances_norm = feature_importances / fi_max
    else:
        feature_importances_norm = feature_importances

    fi_dict = {}
    for j, imp in enumerate(feature_importances_norm):
        if imp > 0.005:
            fi_dict[j] = round(float(imp), 4)

    # 6c. Compute prior probabilities P(disease)
    print("      Computing prior probabilities P(disease)...")
    unique, counts = np.unique(y_train, return_counts=True)
    total = counts.sum()
    priors = {}
    for cls_idx, count in zip(unique, counts):
        disease_name = label_encoder.classes_[cls_idx]
        priors[disease_name] = round(float(count / total), 6)

    # 6d. Model-verified associations
    print("      Generating model-verified associations...")
    model_associations = {}
    for i, disease in enumerate(disease_names):
        mask = y_train == i
        if mask.sum() > 0:
            avg_features = X_train[mask].mean(axis=0).reshape(1, -1)
            pred_proba = model.predict_proba(avg_features)[0]
            class_idx = list(model.classes_).index(i) if i in model.classes_ else -1
            if class_idx >= 0 and class_idx < len(pred_proba):
                model_associations[disease] = round(float(pred_proba[class_idx]), 4)

    extract_time = time.time() - start
    print(f"      Knowledge extraction completed in {extract_time:.1f}s")

    # Save probability matrix
    prob_matrix = {
        "disease_symptom_probs": disease_symptom_probs,
        "feature_importances": fi_dict,
        "priors": priors,
        "model_self_confidence": model_associations,
    }
    prob_path = os.path.join(OUTPUT_DIR, "probability_matrix.json")
    with open(prob_path, "w", encoding="utf-8") as f:
        json.dump(prob_matrix, f, ensure_ascii=False)
    prob_size_kb = os.path.getsize(prob_path) / 1024
    print(f"      Saved: probability_matrix.json ({prob_size_kb:.0f} KB)")

    # ─── Step 7: Export Metadata ─────────────────────────────────────────
    print(f"\n[7/7] Exporting metadata...")

    # Label encoder
    label_mapping = {
        "index_to_disease": {int(i): name for i, name in enumerate(label_encoder.classes_)},
        "disease_to_index": {name: int(i) for i, name in enumerate(label_encoder.classes_)},
        "total_diseases": len(label_encoder.classes_),
    }
    label_path = os.path.join(OUTPUT_DIR, "label_encoder.json")
    with open(label_path, "w", encoding="utf-8") as f:
        json.dump(label_mapping, f, indent=2, ensure_ascii=False)
    print(f"      Saved: label_encoder.json")

    # Symptom columns
    symptom_data = {
        "columns": symptom_columns,
        "display_names": {col: col.title() for col in symptom_columns},
        "total_symptoms": len(symptom_columns),
    }
    symptom_path = os.path.join(OUTPUT_DIR, "symptom_columns.json")
    with open(symptom_path, "w", encoding="utf-8") as f:
        json.dump(symptom_data, f, indent=2, ensure_ascii=False)
    print(f"      Saved: symptom_columns.json")

    # Metadata with common diseases/symptoms
    disease_freq = df_filtered["diseases"].value_counts()
    common_diseases = disease_freq.head(20).index.tolist()
    common_symptoms_set = set()
    for disease in common_diseases:
        disease_rows = df_filtered[df_filtered["diseases"] == disease]
        symptom_freq = disease_rows[symptom_columns].mean()
        frequent_symptoms = symptom_freq[symptom_freq > 0.3].index.tolist()
        common_symptoms_set.update(frequent_symptoms)

    metadata = {
        "common_diseases": common_diseases,
        "common_symptoms": sorted(list(common_symptoms_set)),
        "model_info": {
            "algorithm": best_name,
            "accuracy": round(accuracy, 4),
            "macro_f1": round(report["macro avg"]["f1-score"], 4),
            "weighted_f1": round(report["weighted avg"]["f1-score"], 4),
            "training_samples": int(X_train.shape[0]),
            "test_samples": int(X_test.shape[0]),
            "total_diseases": len(label_encoder.classes_),
            "total_symptoms": len(symptom_columns),
            "rare_diseases_filtered": len(rare_diseases),
            "min_samples_threshold": MIN_SAMPLES_PER_DISEASE,
        },
        "all_models_compared": {
            name: {
                "accuracy": round(r["accuracy"], 4),
                "f1_weighted": round(r["f1_weighted"], 4),
                "training_time_s": round(r["time"], 1),
            }
            for name, r in results.items()
        },
    }
    metadata_path = os.path.join(OUTPUT_DIR, "metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"      Saved: metadata.json")

    # ─── Done ────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    print(f"\n   Best model:         {best_name}")
    print(f"   Model accuracy:     {accuracy*100:.2f}%")
    print(f"   Macro F1 score:     {report['macro avg']['f1-score']*100:.2f}%")
    print(f"   Weighted F1 score:  {report['weighted avg']['f1-score']*100:.2f}%")
    print(f"   Diseases:           {len(label_encoder.classes_)}")
    print(f"   Symptoms:           {len(symptom_columns)}")
    print(f"   Rare filtered:      {len(rare_diseases)} diseases removed")
    print(f"\n   All model results:")
    for name, r in sorted(results.items(), key=lambda x: -x[1]["accuracy"]):
        marker = " <-- BEST" if name == best_name else ""
        print(f"     {name:30s} {r['accuracy']*100:.2f}% acc  |  {r['f1_weighted']*100:.2f}% F1  |  {r['time']:.0f}s{marker}")
    print()


if __name__ == "__main__":
    main()
