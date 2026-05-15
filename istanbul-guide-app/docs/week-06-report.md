# Week 06 Progress Report: Offline Capability & Application Resilience

## 1. Objective Overview
The primary goal for this week was to implement **Offline Usage Capabilities** and enhance the application's overall resilience against poor network conditions. To meet the non-functional requirement of offline accessibility, the architecture was modified to support a robust caching strategy, allowing users to interact with the application seamlessly even when disconnected from the internet.

## 2. Implemented Features & Technical Details

### 2.1 Network State Detection
- **Library Integration**: Integrated the `expo-network` module to securely track device connectivity.
- **Custom Hook Implementation**: Developed a reusable React Hook (`useNetworkStatus.ts`) that asynchronously polls the device's internet reachability. This decouples the network monitoring logic from the UI components.

### 2.2 Global Offline Feedback (UI/UX)
- **Offline Banner Component**: Created a persistent but non-intrusive UI element (`OfflineBanner.tsx`) that alerts the user when the application defaults to offline mode.
- **Layout Integration**: Wrapped the application's Root Layout (`_layout.tsx`) with the banner, ensuring the network status is globally visible across all tabs and stack screens while respecting the device's safe area insets.

### 2.3 Data Persistence & Caching Architecture
We implemented `@react-native-async-storage/async-storage` as our primary local storage solution to persist data retrieved from our Supabase backend and backend APIs.

- **Places & POI Caching (`places.services.ts`)**:
  - Refactored `getHistoricalPlaces` to cache fetched destinations locally.
  - Added fallback mechanisms: If both the backend REST API and the Supabase connection fail or time out, the system automatically pulls the last known state from `AsyncStorage`.
- **User Specific Data**:
  - Added cache read/write logic to user-dependent queries, such as `getUserFavoritePlaces`, `getUserTrips`, and `getTripPlaces`. This allows users to access their customized itineraries and saved locations entirely offline.

### 2.4 Generative AI Module Offline Fallbacks
To ensure the LLM-generated tourism content remains accessible:
- **Description Caching (`ai.service.ts`)**: Successfully generated AI descriptions for landmarks are now saved locally with a key mapped to the landmark's name (`@ai_desc_{landmarkName}`).
- **Multi-layered Fallback Strategy**:
  1. **Primary**: Attempt to fetch dynamic content from the `tourism-llm-api`.
  2. **Secondary (Offline)**: If the fetch fails, retrieve the previously generated AI response from the local device cache.
  3. **Tertiary (Hard Fallback)**: If the cache is empty (e.g., the user never viewed this place while online), default to predefined static strings bundled within the app.

### 2.5 Robust Error Handling & Crash Prevention
- **Graceful Failures**: Fixed critical bugs related to unhandled promise rejections that occurred when components (such as `LandmarkDetailCard`) mounted while offline.
- **Auth Session Handling**: Wrapped `supabase.auth.getUser()` and associated permission checks in rigorous `try/catch` blocks. Previously, network request failures from the Supabase client caused the app to display a "RedBox" crash screen. The app now swallows these offline-induced errors gracefully and degrades to read-only capabilities without interrupting the user experience.

## 3. Outcomes and Next Steps
**Outcomes:** The application now successfully operates as a read-only guide when the internet is unavailable. Users can explore the map, open points of interest, and read detailed descriptions relying entirely on local data storage.

**Future Considerations for SRS:**
- Investigate offline Map Tile caching strategies (using tools like Mapbox offline mode) to allow full offline navigation rendering.
- Consider implementing an offline queue system, where user actions (like adding a favorite or writing a review while offline) are stored locally and automatically synced to Supabase once connectivity is restored.
