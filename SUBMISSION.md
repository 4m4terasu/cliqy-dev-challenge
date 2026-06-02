## Krok 3 - co zrobiłem/am i dlaczego

Dodałem/am formularz ręcznego dodawania wiadomości. Formularz wywołuje endpoint `/api/classify`, a następnie dodaje wynik do kolejki, dzięki czemu starter pokazuje pełny przepływ: wiadomość klienta -> klasyfikacja AI -> draft odpowiedzi -> decyzja operatora.

Lokalnie użyłem/am Gemini przez endpoint kompatybilny z OpenAI, aby nie zużywać płatnych kredytów OpenAI w zadaniu rekrutacyjnym. Implementacja obsługuje także `OPENAI_API_KEY` i model `gpt-4o-mini`, zgodnie z oryginalną instrukcją zadania.

## AI - jak używałem/am narzędzi

- Narzędzia: Codex i ChatGPT do planowania, wskazówek implementacyjnych, debugowania i przeglądu rozwiązania.
- Prompt który zadziałał najlepiej: "Use Gemini safely through the OpenAI-compatible endpoint. Use server-side API calls only. Validate and normalize the LLM output. Implement manual add message form: manual message input -> AI classification -> draft reply -> human review queue."
- Gdzie AI się pomylił/a i co poprawiłem/am ręcznie: Pierwsza wersja integracji nie ograniczała trybu reasoning Gemini 3.5 Flash, więc model zużywał limit odpowiedzi na rozumowanie i nie zwracał kompletnego JSON-a. Dodałem/am ustawienie `thinking_level: "minimal"` oraz doprecyzowałem/am prompt, aby draft nie wymyślał brakujących danych, takich jak godziny otwarcia. Klucz API pozostał wyłącznie po stronie serwera i nie trafił do repozytorium.
- Szacowany udział AI w kodzie: 85% wygenerowane, 15% ręczna weryfikacja, decyzje integracyjne i testy.
